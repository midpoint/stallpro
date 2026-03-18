const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// 订单项 Schema
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  specs: String,
  quantity: {
    type: Number,
    default: 1
  },
  subtotal: Number
}, { _id: false });

// 订单 Schema
const orderSchema = new mongoose.Schema({
  stallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customerOpenid: String,
  customerName: String,
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'cooking', 'completed', 'taken', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunding', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['wechat', 'alipay', 'cash', 'none'],
    default: 'none'
  },
  transactionId: String,
  paymentTime: Date,
  remarks: String,
  // 取餐信息
  estimatedTime: Number, // 预计等待分钟数
  calledAt: Date,
  takenAt: Date
}, { timestamps: true });

// 生成取餐号
orderSchema.statics.generateOrderNumber = async function(stallId, prefix = 'A') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 获取今天该摊位的订单数
  const count = await this.countDocuments({
    stallId,
    createdAt: { $gte: today }
  });

  const num = (count + 1).toString().padStart(2, '0');
  return `${prefix}${num}`;
};

// 创建订单
orderSchema.statics.createOrder = async function(data) {
  const { stallId, items, customerId, customerOpenid, remarks, paymentMethod } = data;

  // 计算总价
  let totalAmount = 0;
  const orderItems = items.map(item => {
    const subtotal = item.price * item.quantity;
    totalAmount += subtotal;
    return {
      productId: item.productId,
      name: item.name,
      price: item.price,
      specs: item.specs,
      quantity: item.quantity,
      subtotal
    };
  });

  // 生成取餐号
  const stall = require('./Stall');
  const stallDoc = await stall.findById(stallId);
  const prefix = stallDoc?.settings?.orderPrefix || 'A';
  const orderNumber = await this.generateOrderNumber(stallId, prefix);

  const order = new this({
    stallId,
    orderNumber,
    customerId,
    customerOpenid,
    items: orderItems,
    totalAmount,
    finalAmount: totalAmount,
    remarks,
    paymentMethod: paymentMethod || 'none'
  });

  return order.save();
};

// 索引
orderSchema.index({ stallId: 1, status: 1 });
orderSchema.index({ stallId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerId: 1 });

module.exports = mongoose.model('Order', orderSchema);
