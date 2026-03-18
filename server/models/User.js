const mongoose = require('mongoose');

// 用户 Schema
const userSchema = new mongoose.Schema({
  openid: {
    type: String,
    unique: true,
    sparse: true
  },
  unionid: String,
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
  nickname: String,
  avatar: String,
  role: {
    type: String,
    enum: ['owner', 'customer'],
    default: 'customer'
  },
  // 摊主特有字段
  stalls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
