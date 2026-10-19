
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Product, Customer, Supplier } from './models.js';
dotenv.config();

if (!process.env.MONGO_URI) process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/erp_management';
await mongoose.connect(process.env.MONGO_URI);
await User.deleteMany({ email: 'admin@erp.local' });
await User.create({ name: 'ERP Admin', email: 'admin@erp.local', password: await bcrypt.hash('Admin123!', 12), role: 'Admin' });
if (await Product.countDocuments() === 0) {
  await Product.insertMany([
    { title: 'Wireless Mouse', sku: 'ACC-001', price: 599, stock: 45, reorderLevel: 10, category: 'Accessories' },
    { title: 'Mechanical Keyboard', sku: 'ACC-002', price: 2499, stock: 18, reorderLevel: 5, category: 'Accessories' },
    { title: 'USB-C Hub', sku: 'ACC-003', price: 1799, stock: 4, reorderLevel: 8, category: 'Accessories' }
  ]);
}
if (await Customer.countDocuments() === 0) await Customer.create({ name: 'Acme Retail', email: 'buyer@example.com', phone: '+91 9876543210', address: 'Agra, Uttar Pradesh' });
if (await Supplier.countDocuments() === 0) await Supplier.create({ name: 'Tech Supplies India', email: 'sales@supplier.example', phone: '+91 9123456780', address: 'Delhi, India' });
console.log('Seed complete. Login: admin@erp.local / Admin123!');
await mongoose.disconnect();
