const express = require('express');
const router = express.Router();
const Stall = require('../models/Stall');
const auth = require('../middleware/auth');

// 获取摊位信息（公开）
router.get('/:id', async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.id)
      .select('name logo description notice status');

    if (!stall || stall.status !== 'active') {
      return res.status(404).json({ success: false, message: '摊位不存在' });
    }

    res.json({
      success: true,
      data: stall
    });
  } catch (error) {
    console.error('获取摊位失败:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 获取摊位配置（摊主）
router.get('/:id/config', auth, async (req, res) => {
  try {
    const stall = await Stall.findOne({
      _id: req.params.id,
      ownerId: req.user.userId
    });

    if (!stall) {
      return res.status(404).json({ success: false, message: '摊位不存在' });
    }

    res.json({
      success: true,
      data: stall
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 更新摊位信息
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, logo, description, notice, settings, paymentConfig } = req.body;

    const stall = await Stall.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      {
        $set: {
          name,
          logo,
          description,
          notice,
          settings,
          paymentConfig
        }
      },
      { new: true }
    );

    if (!stall) {
      return res.status(404).json({ success: false, message: '摊位不存在' });
    }

    res.json({
      success: true,
      data: stall
    });
  } catch (error) {
    console.error('更新摊位失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// 获取我的摊位列表
router.get('/owner/my', auth, async (req, res) => {
  try {
    const stalls = await Stall.find({ ownerId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: stalls
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 创建摊位
router.post('/', auth, async (req, res) => {
  try {
    const { name, logo, description, notice } = req.body;

    const stall = new Stall({
      ownerId: req.user.userId,
      name,
      logo,
      description,
      notice
    });

    await stall.save();

    // 关联到用户
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { stalls: stall._id }
    });

    res.json({
      success: true,
      data: stall
    });
  } catch (error) {
    console.error('创建摊位失败:', error);
    res.status(500).json({ success: false, message: '创建失败' });
  }
});

// 生成摊位二维码
router.post('/:id/qrcode', auth, async (req, res) => {
  try {
    const stall = await Stall.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      {
        $set: {
          qrcode: `/api/qrcode/${stall._id}`
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        qrcode: stall.qrcode,
        url: `${process.env.BASE_URL || 'http://localhost:3001'}/pages/menu/menu?stallId=${stall._id}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '生成失败' });
  }
});

module.exports = router;
