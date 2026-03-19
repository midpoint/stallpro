// Vercel Serverless 入口
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 模拟数据存储
const mockData = {
  // 用户
  users: [
    { _id: 'user1', openid: 'test_user_1', nickname: '王师傅', role: 'owner', stallId: 'stall1', createdAt: new Date().toISOString() }
  ],
  // 摊位
  stalls: [
    { _id: 'stall1', ownerId: 'user1', name: '老王鸡蛋灌饼', notice: '今日特惠：加肠免费！', settings: { orderPrefix: 'A' }, status: 'active' }
  ],
  // 商品
  products: [
    { _id: 'p1', stallId: 'stall1', name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
    { _id: 'p2', stallId: 'stall1', name: '手抓饼', price: 10, category: '主食', status: 'active' },
    { _id: 'p3', stallId: 'stall1', name: '烤冷面', price: 8, category: '主食', status: 'active' },
    { _id: 'p4', stallId: 'stall1', name: '烤肠', price: 2, category: '小吃', status: 'active' }
  ],
  // 订单
  orders: []
};

let userCounter = 1;
let stallCounter = 1;
let orderCounter = 0;

const generateOrderNumber = (prefix = 'A') => {
  orderCounter++;
  return `${prefix}${orderCounter.toString().padStart(2, '0')}`;
};

// 简单的JWT token生成
const generateToken = (userId) => {
  return Buffer.from(JSON.stringify({ userId, time: Date.now() })).toString('base64');
};

// 简单的token验证
const verifyToken = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return null;
  }
};

// API 路由
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: '摆摊666 API', version: '2.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ===== 认证API =====

// 微信登录 - 兼容新旧版本
app.post('/api/auth/login', (req, res) => {
  const { code, userInfo, openid } = req.body;

  // 模拟通过code获取openid（实际需要调用微信API）
  const userOpenid = openid || `wx_${code || 'demo'}_${Date.now()}`;

  // 查找或创建用户
  let user = mockData.users.find(u => u.openid === userOpenid);

  if (!user) {
    userCounter++;
    user = {
      _id: `user${userCounter}`,
      openid: userOpenid,
      nickname: userInfo?.nickName || '新用户',
      avatar: userInfo?.avatarUrl || '',
      role: 'owner',
      stallId: null,
      createdAt: new Date().toISOString()
    };
    mockData.users.push(user);
  }

  // 如果用户没有摊位，自动创建一个
  if (!user.stallId) {
    stallCounter++;
    const stall = {
      _id: `stall${stallCounter}`,
      ownerId: user._id,
      name: `${user.nickname || '新店铺'}`,
      notice: '欢迎光临！',
      settings: { orderPrefix: 'A' },
      status: 'active'
    };
    mockData.stalls.push(stall);
    user.stallId = stall._id;
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        stallId: user.stallId
      }
    }
  });
});

// 获取当前用户信息
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({ success: false, message: '未登录' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.json({ success: false, message: '无效token' });
  }

  const user = mockData.users.find(u => u._id === decoded.userId);
  if (!user) {
    return res.json({ success: false, message: '用户不存在' });
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      stallId: user.stallId
    }
  });
});

// ===== 摊位API =====

// 获取摊位信息
app.get('/api/stall/:id', (req, res) => {
  const stall = mockData.stalls.find(s => s._id === req.params.id);
  stall ? res.json({ success: true, data: stall }) : res.json({ success: false, message: '不存在' });
});

// 获取我的摊位（需要登录）
app.get('/api/stall/my', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.json({ success: false, message: '请先登录' });
  }

  const user = mockData.users.find(u => u._id === decoded.userId);
  if (!user || !user.stallId) {
    return res.json({ success: false, message: '暂无摊位' });
  }

  const stall = mockData.stalls.find(s => s._id === user.stallId);
  res.json({ success: true, data: stall });
});

// 更新摊位信息
app.put('/api/stall/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.json({ success: false, message: '请先登录' });
  }

  const stall = mockData.stalls.find(s => s._id === req.params.id);
  if (!stall) {
    return res.json({ success: false, message: '摊位不存在' });
  }

  // 验证归属
  if (stall.ownerId !== decoded.userId) {
    return res.json({ success: false, message: '无权限' });
  }

  // 更新字段
  const { name, notice, settings } = req.body;
  if (name) stall.name = name;
  if (notice !== undefined) stall.notice = notice;
  if (settings) stall.settings = { ...stall.settings, ...settings };

  res.json({ success: true, data: stall });
});

// ===== 商品API =====

// 获取商品列表
app.get('/api/product/stall/:stallId', (req, res) => {
  const products = mockData.products.filter(p => p.stallId === req.params.stallId && p.status === 'active');
  res.json({ success: true, data: products });
});

// ===== 订单API =====

// 创建订单
app.post('/api/order', (req, res) => {
  const { stallId, items } = req.body;
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const stall = mockData.stalls.find(s => s._id === stallId);
  const prefix = stall?.settings?.orderPrefix || 'A';

  const order = {
    _id: `order_${Date.now()}`,
    stallId,
    orderNumber: generateOrderNumber(prefix),
    items,
    totalAmount,
    status: 'pending',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString()
  };

  mockData.orders.push(order);
  res.json({ success: true, data: order });
});

// 获取订单列表
app.get('/api/order/stall/:stallId', (req, res) => {
  const orders = mockData.orders.filter(o => o.stallId === req.params.stallId);
  res.json({ success: true, data: { list: orders, total: orders.length } });
});

// 更新订单状态
app.put('/api/order/:id/status', (req, res) => {
  const { status } = req.body;
  const order = mockData.orders.find(o => o._id === req.params.id);
  order ? (order.status = status, res.json({ success: true, data: order })) : res.json({ success: false });
});

// 叫号
app.post('/api/order/:id/call', (req, res) => {
  const order = mockData.orders.find(o => o._id === req.params.id);
  order ? (order.status = 'completed', order.calledAt = new Date().toISOString(), res.json({ success: true, data: order })) : res.json({ success: false });
});

// ===== 统计API =====

// 今日统计
app.get('/api/stats/today/:stallId', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const orders = mockData.orders.filter(o => o.stallId === req.params.stallId && o.createdAt.startsWith(today));
  res.json({
    success: true,
    data: {
      orderCount: orders.length,
      todayRevenue: orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0),
      pendingCount: orders.filter(o => o.status === 'pending').length
    }
  });
});

// Vercel Serverless export
module.exports = app;
