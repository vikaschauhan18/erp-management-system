
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['Admin', 'Sales', 'Purchase', 'Inventory'], default: 'Sales' }
}, { timestamps: true });

const productSchema = new Schema({
  title: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 5, min: 0 },
  category: { type: String, default: 'General' }
}, { timestamps: true });

const partySchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: String,
  phone: String,
  address: String
}, { timestamps: true });

const lineSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  title: String,
  sku: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const salesOrderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: { type: [lineSchema], validate: v => v.length > 0 },
  status: { type: String, enum: ['Draft', 'Confirmed', 'Fulfilled', 'Cancelled'], default: 'Draft' },
  totalPrice: { type: Number, default: 0 },
  notes: String
}, { timestamps: true });

const purchaseOrderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: { type: [lineSchema], validate: v => v.length > 0 },
  status: { type: String, enum: ['Draft', 'Ordered', 'Received', 'Cancelled'], default: 'Draft' },
  totalPrice: { type: Number, default: 0 },
  notes: String
}, { timestamps: true });

const grnSchema = new Schema({
  grnNumber: { type: String, unique: true },
  purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  receivedItems: [{ product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, min: 1, required: true } }],
  notes: String,
  receivedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const invoiceSchema = new Schema({
  invoiceNumber: { type: String, unique: true },
  salesOrder: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Unpaid', 'Paid', 'Overdue'], default: 'Unpaid' },
  dueDate: Date
}, { timestamps: true });

export const User = model('User', userSchema);
export const Product = model('Product', productSchema);
export const Customer = model('Customer', partySchema);
export const Supplier = model('Supplier', partySchema);
export const SalesOrder = model('SalesOrder', salesOrderSchema);
export const PurchaseOrder = model('PurchaseOrder', purchaseOrderSchema);
export const GRN = model('GRN', grnSchema);
export const Invoice = model('Invoice', invoiceSchema);
