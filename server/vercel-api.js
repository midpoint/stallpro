// Vercel Serverless 入口 - 支持MongoDB和内存数据
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== 内存数据存储（备用）=====
let userCounter = 1;
let stallCounter = 1;
let orderCounter = 0;

const mockData = {
  users: [],
  stalls: [],
  products: [],
  orders: []
};

// 初始化默认数据
const initMockData = () => {
  if (mockData.users.length === 0) {
    const user = {
      _id: 'user1',
      openid: 'test_user_1',
      nickname: '王师傅',
      role: 'owner',
      stallId: 'stall1',
      createdAt: new Date().toISOString()
    };

    const stall = {
      _id: 'stall1',
      ownerId: 'user1',
      name: '老王鸡蛋灌饼',
      notice: '今日特惠：加肠免费！',
      settings: { orderPrefix: 'A' },
      status: 'active'
    };

    const products = [
      { _id: 'p1', stallId: 'stall1', name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
      { _id: 'p2', stallId: 'stall1', name: '手抓饼', price: 10, category: '主食', status: 'active' },
      { _id: 'p3', stallId: 'stall1', name: '烤冷面', price: 8, category: '主食', status: 'active' },
      { _id: 'p4', stallId: 'stall1', name: '烤肠', price: 2, category: '小吃', status: 'active' }
    ];

    mockData.users.push(user);
    mockData.stalls.push(stall);
    mockData.products.push(...products);

    userCounter = 1;
    stallCounter = 1;
    orderCounter = 0;

    console.log('Mock data initialized');
  }
};

initMockData();

// ===== MongoDB连接（可选）=====
let db = null;
const connectDB = require('./db');

(async () => {
  try {
    db = await connectDB();
    console.log('MongoDB connected');
  } catch (e) {
    console.log('Using in-memory data');
  }
})();

// 判断是否使用MongoDB
const useMongoDB = () => db && mongoose && mongoose.connection.readyState === 1;

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

// 生成订单号
const generateOrderNumber = (prefix = 'A') => {
  orderCounter++;
  return `${prefix}${orderCounter.toString().padStart(2, '0')}`;
};

// ===== API路由 =====

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: '摆摊666 API', version: '2.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ===== 认证API =====

// 登录
app.post('/api/auth/login', (req, res) => {
  const { code, userInfo, openid } = req.body;
  const userOpenid = openid || `wx_${code || 'demo'}_${Date.now()}`;

  // 查找或创建用户（内存数据）
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

  // 如果用户没有摊位，创建一个
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

    // 添加默认商品
    const defaultProducts = [
      { _id: `p${stallCounter}1`, stallId: stall._id, name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
      { _id: `p${stallCounter}2`, stallId: stall._id, name: '手抓饼', price: 10, category: '主食', status: 'active' },
      { _id: `p${stallCounter}3`, stallId: stall._id, name: '烤冷面', price: 8, category: '主食', status: 'active' }
    ];
    mockData.products.push(...defaultProducts);
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

// 获取当前用户
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

app.get('/api/stall/:id', (req, res) => {
  const stall = mockData.stalls.find(s => s._id === req.params.id || s._id.includes(req.params.id));
  stall ? res.json({ success: true, data: stall }) : res.json({ success: false, message: '不存在' });
});

app.get('/api/stall/my', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded) return res.json({ success: false, message: '请先登录' });

  const user = mockData.users.find(u => u._id === decoded.userId);
  if (!user || !user.stallId) return res.json({ success: false, message: '暂无摊位' });

  const stall = mockData.stalls.find(s => s._id === user.stallId);
  res.json({ success: true, data: stall });
});

app.put('/api/stall/:id', (req, res) => {
  const stall = mockData.stalls.find(s => s._id === req.params.id || s._id.includes(req.params.id));
  if (!stall) return res.json({ success: false, message: '摊位不存在' });

  const { name, notice, settings } = req.body;
  if (name) stall.name = name;
  if (notice !== undefined) stall.notice = notice;
  if (settings) stall.settings = { ...stall.settings, ...settings };

  res.json({ success: true, data: stall });
});

// ===== 商品API =====

app.get('/api/product/stall/:stallId', (req, res) => {
  const stall = mockData.stalls.find(s => s._id === req.params.stallId || s._id.includes(req.params.stallId));
  if (!stall) return res.json({ success: true, data: [] });

  const products = mockData.products.filter(p => p.stallId === stall._id && p.status === 'active');
  res.json({ success: true, data: products });
});

// ===== 订单API =====

app.post('/api/order', (req, res) => {
  const { stallId, items } = req.body;
  const stall = mockData.stalls.find(s => s._id === stallId || s._id.includes(stallId));

  if (!stall) {
    // 使用默认摊位
    const defaultStall = mockData.stalls[0] || { _id: 'stall1', settings: { orderPrefix: 'A' } };
    const order = {
      _id: `order_${Date.now()}`,
      stallId: defaultStall._id,
      orderNumber: generateOrderNumber(defaultStall.settings?.orderPrefix || 'A'),
      items,
      totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString()
    };
    mockData.orders.push(order);
    return res.json({ success: true, data: order });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    _id: `order_${Date.now()}`,
    stallId: stall._id,
    orderNumber: generateOrderNumber(stall.settings?.orderPrefix || 'A'),
    items,
    totalAmount,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString()
  };

  mockData.orders.push(order);
  res.json({ success: true, data: order });
});

app.post('/api/order/:id/pay', (req, res) => {
  const order = mockData.orders.find(o => o._id === req.params.id);
  if (!order) return res.json({ success: false, message: '订单不存在' });
  if (order.paymentStatus === 'paid') return res.json({ success: false, message: '订单已支付' });

  res.json({ success: true, data: { orderId: order._id, totalAmount: order.totalAmount, mockPay: true } });
});

app.post('/api/order/:id/payNotify', (req, res) => {
  const order = mockData.orders.find(o => o._id === req.params.id);
  if (order) {
    order.paymentStatus = 'paid';
    order.transactionId = req.body.transactionId || `tx_${Date.now()}`;
    order.paidAt = new Date().toISOString();
  }
  res.json({ success: true });
});

app.get('/api/order/:id', (req, res) => {
  const order = mockData.orders.find(o => o._id === req.params.id);
  order ? res.json({ success: true, data: order }) : res.json({ success: false, message: '订单不存在' });
});

app.get('/api/order/stall/:stallId', (req, res) => {
  const stall = mockData.stalls.find(s => s._id === req.params.stallId || s._id.includes(req.params.stallId));
  if (!stall) return res.json({ success: true, data: { list: [], total: 0 } });

  const orders = mockData.orders.filter(o => o.stallId === stall._id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: { list: orders, total: orders.length } });
});

app.put('/api/order/:id/status', (req, res) => {
  const { status } = req.body;
  const order = mockData.orders.find(o => o._id === req.params.id);
  if (order) {
    order.status = status;
    return res.json({ success: true, data: order });
  }
  res.json({ success: false });
});

app.post('/api/order/:id/call', (req, res) => {
  const order = mockData.orders.find(o => o._id === req.params.id);
  if (order) {
    order.status = 'completed';
    order.calledAt = new Date().toISOString();
    return res.json({ success: true, data: order });
  }
  res.json({ success: false });
});

// ===== 统计API =====

app.get('/api/stats/today/:stallId', (req, res) => {
  const stall = mockData.stalls.find(s => s._id === req.params.stallId || s._id.includes(req.params.stallId));
  if (!stall) return res.json({ success: true, data: { orderCount: 0, todayRevenue: 0, pendingCount: 0 } });

  const today = new Date().toISOString().split('T')[0];
  const orders = mockData.orders.filter(o => o.stallId === stall._id && o.createdAt.startsWith(today));

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
