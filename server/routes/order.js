const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// 创建订单（顾客端）
router.post('/', async (req, res) => {
  try {
    const { stallId, items, customerOpenid, remarks, paymentMethod } = req.body;

    // 验证商品
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'active') {
        return res.json({
          success: false,
          message: `商品 ${item.name} 已下架`
        });
      }
      // 检查库存
      if (product.stock >= 0 && product.stock < item.quantity) {
        return res.json({
          success: false,
          message: `商品 ${item.name} 库存不足`
        });
      }
    }

    const order = await Order.createOrder({
      stallId,
      items,
      customerOpenid,
      remarks,
      paymentMethod
    });

    // 发送WebSocket通知
    const io = require('../index').io;
    io.to(`stall_${stallId}`).emit('new_order', order);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

// 获取订单列表（摊主）
router.get('/stall/:stallId', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { stallId: req.params.stallId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        list: orders,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 获取订单详情
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 通过取餐号查询
router.get('/number/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 更新订单状态（摊主）
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, callNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    order.status = status;

    if (status === 'completed') {
      order.calledAt = new Date();

      // 发送叫号通知
      const io = require('../index').io;
      io.to(`stall_${order.stallId}`).emit('order_called', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    }

    if (status === 'taken') {
      order.takenAt = new Date();

      // 更新商品销量
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { soldCount: item.quantity }
        });
      }
    }

    await order.save();

    // 广播更新
    const io = require('../index').io;
    io.to(`stall_${order.stallId}`).emit('order_updated', order);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('更新订单失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// 叫号
router.post('/:id/call', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    order.status = 'completed';
    order.calledAt = new Date();
    await order.save();

    // 广播叫号
    const io = require('../index').io;
    io.to(`stall_${order.stallId}`).emit('order_called', {
      orderId: order._id,
      orderNumber: order.orderNumber
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '叫号失败' });
  }
});

// 顾客查询自己的订单
router.get('/customer/:openid', async (req, res) => {
  try {
    const orders = await Order.find({ customerOpenid: req.params.openid })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

module.exports = router;
