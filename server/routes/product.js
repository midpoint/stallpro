const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// 获取摊位商品列表（公开）
router.get('/stall/:stallId', async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const products = await Product.find({
      stallId: req.params.stallId,
      status
    }).sort({ sort: 1, createdAt: -1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 获取商品分类
router.get('/stall/:stallId/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { stallId: req.params.stallId, status: 'active' } },
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: categories.map(c => c._id)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 创建商品
router.post('/', auth, async (req, res) => {
  try {
    const { stallId, name, price, image, category, description, specs, stock } = req.body;

    // 验证摊位归属
    const Stall = require('../models/Stall');
    const stall = await Stall.findOne({ _id: stallId, ownerId: req.user.userId });

    if (!stall) {
      return res.status(403).json({ success: false, message: '无权限' });
    }

    // 获取最大排序
    const maxSort = await Product.findOne({ stallId }).sort({ sort: -1 });
    const sort = maxSort ? maxSort.sort + 1 : 0;

    const product = new Product({
      stallId,
      name,
      price,
      image,
      category: category || '未分类',
      description,
      specs: specs || [],
      stock: stock ?? -1,
      sort
    });

    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({ success: false, message: '创建失败' });
  }
});

// 批量创建商品
router.post('/batch', auth, async (req, res) => {
  try {
    const { stallId, products } = req.body;

    // 验证摊位归属
    const Stall = require('../models/Stall');
    const stall = await Stall.findOne({ _id: stallId, ownerId: req.user.userId });

    if (!stall) {
      return res.status(403).json({ success: false, message: '无权限' });
    }

    const productDocs = products.map((p, index) => ({
      stallId,
      name: p.name,
      price: p.price,
      image: p.image || '',
      category: p.category || '未分类',
      description: p.description || '',
      specs: p.specs || [],
      stock: p.stock ?? -1,
      sort: index
    }));

    const created = await Product.insertMany(productDocs);

    res.json({
      success: true,
      data: created
    });
  } catch (error) {
    console.error('批量创建商品失败:', error);
    res.status(500).json({ success: false, message: '创建失败' });
  }
});

// 更新商品
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, price, image, category, description, specs, stock, status, sort } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    // 验证归属
    const Stall = require('../models/Stall');
    const stall = await Stall.findOne({ _id: product.stallId, ownerId: req.user.userId });

    if (!stall) {
      return res.status(403).json({ success: false, message: '无权限' });
    }

    // 更新字段
    if (name) product.name = name;
    if (price !== undefined) product.price = price;
    if (image !== undefined) product.image = image;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (specs) product.specs = specs;
    if (stock !== undefined) product.stock = stock;
    if (status) product.status = status;
    if (sort !== undefined) product.sort = sort;

    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// 删除商品
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    // 验证归属
    const Stall = require('../models/Stall');
    const stall = await Stall.findOne({ _id: product.stallId, ownerId: req.user.userId });

    if (!stall) {
      return res.status(403).json({ success: false, message: '无权限' });
    }

    product.status = 'deleted';
    await product.save();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

module.exports = router;
