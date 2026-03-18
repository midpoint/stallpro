const mongoose = require('mongoose');

// 商品 Schema
const productSchema = new mongoose.Schema({
  stallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: String,
  category: {
    type: String,
    default: '未分类'
  },
  description: String,
  specs: [{
    name: String,
    required: { type: Boolean, default: false },
    options: [{
      label: String,
      price: { type: Number, default: 0 }
    }]
  }],
  stock: {
    type: Number,
    default: -1 // -1 表示无限制
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  sort: {
    type: Number,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// 索引
productSchema.index({ stallId: 1, status: 1 });
productSchema.index({ stallId: 1, category: 1 });

module.exports = mongoose.model('Product', productSchema);
