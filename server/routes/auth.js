const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'stallpro-secret-key';

// 微信登录
router.post('/wechat_login', async (req, res) => {
  try {
    const { code, userInfo } = req.body;

    // TODO: 通过 code 获取 openid
    // const openid = await getWechatOpenid(code);

    // 模拟 openid
    const openid = `wx_${code}_${Date.now()}`;

    let user = await User.findOne({ openid });

    if (!user) {
      // 新用户
      user = new User({
        openid,
        nickname: userInfo?.nickName || '新用户',
        avatar: userInfo?.avatarUrl || '',
        role: 'customer'
      });
      await user.save();
    }

    // 生成 token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 手机号登录/注册
router.post('/phone_login', async (req, res) => {
  try {
    const { phone, code, nickname } = req.body;

    // TODO: 验证手机验证码

    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({
        phone,
        nickname: nickname || '用户' + phone.slice(-4),
        role: 'owner'
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          phone: user.phone,
          nickname: user.nickname,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('手机号登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(401).json({ success: false, message: '无效的token' });
  }
});

module.exports = router;
