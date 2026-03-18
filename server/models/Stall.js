const mongoose = require('mongoose');

// 摊位 Schema
const stallSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  logo: String,
  description: String,
  notice: {
    type: String,
    default: '欢迎光临！'
  },
  qrcode: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  settings: {
    orderPrefix: { type: String, default: 'A' },
    autoCall: { type: Boolean, default: true },
    voiceEnabled: { type: Boolean, default: true },
    screenOffEnabled: { type: Boolean, default: true },
    vibration: { type: Boolean, default: true },
    soundType: { type: String, default: 'default' }
  },
  // 支付配置
  paymentConfig: {
    wechatEnabled: { type: Boolean, default: false },
    alipayEnabled: { type: Boolean, default: false },
    wechatMchId: String,
    wechatApiKey: String,
    alipayAppId: String,
    alipayPrivateKey: String
  },
  // 统计
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  }
}, { timestamps: true });

// 生成摊位二维码链接
stallSchema.methods.getQrcodeUrl = function() {
  return `/pages/menu/menu?stallId=${this._id}`;
};

module.exports = mongoose.model('Stall', stallSchema);
