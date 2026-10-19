
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User, Product, Customer, Supplier, SalesOrder, PurchaseOrder, GRN, Invoice } from './models.js';
import { protect, allowRoles, notFound, errorHandler } from './middleware.js';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true }));
app.use(express.json({ limit: '1mb' }));

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const check = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  next();
};
const tokenFor = user => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
const safeUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const admin = [protect, allowRoles('Admin')];

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ERP Management API' }));

app.post('/api/auth/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], check, asyncRoute(async (req, res) => {
  const count = await User.countDocuments();
  // First registered user becomes Admin; later public registrations are Sales users.
  const role = count === 0 ? 'Admin' : 'Sales';
  const user = await User.create({ name: req.body.name, email: req.body.email, password: await bcrypt.hash(req.body.password, 12), role });
  res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
}));

app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], check, asyncRoute(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: tokenFor(user), user: safeUser(user) });
}));
app.get('/api/auth/me', protect, (req, res) => res.json({ user: safeUser(req.user) }));
app.get('/api/users', ...admin, asyncRoute(async (req, res) => res.json(await User.find().select('-password').sort({ createdAt: -1 }))));

function crudRoutes(path, Model, roles = ['Admin', 'Sales', 'Purchase', 'Inventory']) {
  const router = express.Router();
  router.use(protect);
  router.get('/', asyncRoute(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
    const search = String(req.query.search || '').trim();
    const query = search ? { $or: [{ title: new RegExp(search, 'i') }, { name: new RegExp(search, 'i') }, { sku: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};
    const [items, total] = await Promise.all([Model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Model.countDocuments(query)]);
    res.json({ items, page, pages: Math.ceil(total / limit), total });
  }));
  router.post('/', allowRoles(...roles), asyncRoute(async (req, res) => res.status(201).json(await Model.create(req.body))));
  router.put('/:id', allowRoles(...roles), asyncRoute(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Record not found' });
    res.json(item);
  }));
  router.delete('/:id', allowRoles('Admin', 'Inventory'), asyncRoute(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  }));
  app.use(`/api/${path}`, router);
}
crudRoutes('products', Product, ['Admin', 'Inventory', 'Purchase']);
crudRoutes('customers', Customer, ['Admin', 'Sales']);
crudRoutes('suppliers', Supplier, ['Admin', 'Purchase']);

const orderRouter = (path, Model, partyKey, Party, prefix, statuses) => {
  const r = express.Router();
  r.use(protect);
  r.get('/', asyncRoute(async (req, res) => {
    const items = await Model.find().populate(partyKey, 'name').populate('items.product', 'title sku').sort({ createdAt: -1 }).limit(200);
    res.json({ items, total: items.length });
  }));
  r.post('/', allowRoles('Admin', partyKey === 'customer' ? 'Sales' : 'Purchase'), asyncRoute(async (req, res) => {
    const { [partyKey]: partyId, items = [], notes = '' } = req.body;
    if (!partyId || !items.length) return res.status(400).json({ message: `${partyKey} and at least one item are required` });
    let totalPrice = 0;
    const normalized = [];
    for (const line of items) {
      const product = await Product.findById(line.product);
      if (!product) return res.status(400).json({ message: `Product not found: ${line.product}` });
      const quantity = Number(line.quantity);
      const unitPrice = line.unitPrice == null ? product.price : Number(line.unitPrice);
      if (!Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) return res.status(400).json({ message: 'Each item needs a valid quantity and price' });
      normalized.push({ product: product._id, title: product.title, sku: product.sku, quantity, unitPrice });
      totalPrice += quantity * unitPrice;
    }
    const doc = await Model.create({ [partyKey]: partyId, items: normalized, notes, totalPrice, orderNumber: `${prefix}-${Date.now()}`, status: statuses[0] });
    res.status(201).json(await Model.findById(doc._id).populate(partyKey, 'name').populate('items.product', 'title sku'));
  }));
  r.put('/:id', allowRoles('Admin', partyKey === 'customer' ? 'Sales' : 'Purchase'), asyncRoute(async (req, res) => {
    const allowed = {};
    if (statuses.includes(req.body.status)) allowed.status = req.body.status;
    if (typeof req.body.notes === 'string') allowed.notes = req.body.notes;
    const doc = await Model.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true }).populate(partyKey, 'name');
    if (!doc) return res.status(404).json({ message: 'Order not found' });
    res.json(doc);
  }));
  app.use(`/api/${path}`, r);
};
orderRouter('sales-orders', SalesOrder, 'customer', Customer, 'SO', ['Draft', 'Confirmed', 'Fulfilled', 'Cancelled']);
orderRouter('purchase-orders', PurchaseOrder, 'supplier', Supplier, 'PO', ['Draft', 'Ordered', 'Received', 'Cancelled']);

app.get('/api/grn', protect, asyncRoute(async (req, res) => {
  const items = await GRN.find().populate('purchaseOrder').populate('receivedItems.product', 'title sku').sort({ createdAt: -1 }).limit(200);
  res.json({ items, total: items.length });
}));
app.post('/api/grn', protect, allowRoles('Admin', 'Inventory', 'Purchase'), asyncRoute(async (req, res) => {
  const po = await PurchaseOrder.findById(req.body.purchaseOrder);
  if (!po) return res.status(404).json({ message: 'Purchase order not found' });
  const receivedItems = req.body.receivedItems || po.items.map(i => ({ product: i.product, quantity: i.quantity }));
  if (!receivedItems.length) return res.status(400).json({ message: 'Received items are required' });
  for (const line of receivedItems) {
    const product = await Product.findById(line.product);
    if (!product) return res.status(400).json({ message: 'Invalid product in received items' });
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ message: 'Received quantity must be a positive integer' });
    product.stock += qty;
    await product.save();
  }
  po.status = 'Received';
  await po.save();
  res.status(201).json(await GRN.create({ grnNumber: `GRN-${Date.now()}`, purchaseOrder: po._id, receivedItems, notes: req.body.notes || '' }));
}));
app.get('/api/invoices', protect, asyncRoute(async (req, res) => res.json({ items: await Invoice.find().populate('customer', 'name').populate('salesOrder', 'orderNumber').sort({ createdAt: -1 }).limit(200) })));
app.post('/api/invoices', protect, allowRoles('Admin', 'Sales'), asyncRoute(async (req, res) => {
  const order = await SalesOrder.findById(req.body.salesOrder);
  if (!order) return res.status(404).json({ message: 'Sales order not found' });
  const invoice = await Invoice.create({ invoiceNumber: `INV-${Date.now()}`, salesOrder: order._id, customer: order.customer, amount: order.totalPrice, dueDate: req.body.dueDate || undefined });
  res.status(201).json(await invoice.populate([{ path: 'customer', select: 'name' }, { path: 'salesOrder', select: 'orderNumber' }]));
}));
app.patch('/api/invoices/:id/status', protect, allowRoles('Admin', 'Sales'), asyncRoute(async (req, res) => {
  if (!['Unpaid', 'Paid', 'Overdue'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid invoice status' });
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json(invoice);
}));

app.get('/api/dashboard', protect, asyncRoute(async (req, res) => {
  const [products, customers, suppliers, salesOrders, purchaseOrders, invoices, lowStock, revenue] = await Promise.all([
    Product.countDocuments(), Customer.countDocuments(), Supplier.countDocuments(), SalesOrder.countDocuments(),
    PurchaseOrder.countDocuments(), Invoice.countDocuments(), Product.countDocuments({ $expr: { $lte: ['$stock', '$reorderLevel'] } }),
    Invoice.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);
  res.json({ products, customers, suppliers, salesOrders, purchaseOrders, invoices, lowStock, paidRevenue: revenue[0]?.total || 0 });
}));

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Copy server/.env.example to server/.env and set a strong secret.');
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/erp_management')
  .then(() => app.listen(port, () => console.log(`ERP API running on http://localhost:${port}`)))
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
