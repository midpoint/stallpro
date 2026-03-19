// server/models.js - MongoDB数据模型
const mongoose = require('mongoose');

// 用户模型
const userSchema = new mongoose.Schema({
  openid: { type: String, required: true, unique: true },
  nickname: String,
  avatar: String,
  role: { type: String, default: 'owner' },
  stallId: String,
  createdAt: { type: Date, default: Date.now }
});

// 摊位模型
const stallSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, default: '新店铺' },
  notice: { type: String, default: '欢迎光临！' },
  settings: {
    orderPrefix: { type: String, default: 'A' }
  },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// 商品模型
const productSchema = new mongoose.Schema({
  stallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: '主食' },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// 订单模型
const orderSchema = new mongoose.Schema({
  stallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall' },
  orderNumber: String,
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    specs: String
  }],
  totalAmount: Number,
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'unpaid' },
  transactionId: String,
  paidAt: Date,
  calledAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Stall = mongoose.models.Stall || mongoose.model('Stall', stallSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = { User, Stall, Product, Order };
