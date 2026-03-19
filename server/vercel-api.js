// Vercel Serverless 入口 - 使用MongoDB
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { User, Stall, Product, Order } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 连接数据库
connectDB();

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

// 初始化默认数据（如果没有数据）
const initDefaultData = async () => {
  try {
    // 检查mongoose是否连接成功
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, skipping initDefaultData');
      return;
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // 创建默认用户和摊位
      const user = await User.create({
        openid: 'test_user_1',
        nickname: '王师傅',
        role: 'owner'
      });

      const stall = await Stall.create({
        ownerId: user._id,
        name: '老王鸡蛋灌饼',
        notice: '今日特惠：加肠免费！',
        settings: { orderPrefix: 'A' },
        status: 'active'
      });

      await User.findByIdAndUpdate(user._id, { stallId: stall._id });

      // 创建默认商品
      await Product.create([
        { stallId: stall._id, name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
        { stallId: stall._id, name: '手抓饼', price: 10, category: '主食', status: 'active' },
        { stallId: stall._id, name: '烤冷面', price: 8, category: '主食', status: 'active' },
        { stallId: stall._id, name: '烤肠', price: 2, category: '小吃', status: 'active' }
      ]);

      console.log('Default data initialized');
    }
  } catch (error) {
    console.error('initDefaultData error:', error.message);
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

// 微信登录
app.post('/api/auth/login', async (req, res) => {
  const { code, userInfo, openid } = req.body;
  const userOpenid = openid || `wx_${code || 'demo'}_${Date.now()}`;

  try {
    let user = await User.findOne({ openid: userOpenid });

    if (!user) {
      user = await User.create({
        openid: userOpenid,
        nickname: userInfo?.nickName || '新用户',
        avatar: userInfo?.avatarUrl || '',
        role: 'owner'
      });
    }

    // 如果用户没有摊位，自动创建一个
    if (!user.stallId) {
      const stall = await Stall.create({
        ownerId: user._id,
        name: `${user.nickname || '新店铺'}`,
        notice: '欢迎光临！',
        settings: { orderPrefix: 'A' },
        status: 'active'
      });
      await User.findByIdAndUpdate(user._id, { stallId: stall._id });
      user.stallId = stall._id;

      // 为新摊位创建默认商品
      await Product.create([
        { stallId: stall._id, name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
        { stallId: stall._id, name: '手抓饼', price: 10, category: '主食', status: 'active' },
        { stallId: stall._id, name: '烤冷面', price: 8, category: '主食', status: 'active' }
      ]);
    }

    const token = generateToken(user._id.toString());

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
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: '登录失败' });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({ success: false, message: '未登录' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.json({ success: false, message: '无效token' });
  }

  try {
    const user = await User.findById(decoded.userId);
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
  } catch (error) {
    res.json({ success: false, message: '获取用户信息失败' });
  }
});

// ===== 摊位API =====

// 获取摊位信息
app.get('/api/stall/:id', async (req, res) => {
  try {
    // 支持ObjectId或字符串ID
    let stall;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      stall = await Stall.findById(req.params.id);
    } else {
      // 字符串ID查找
      const stalls = await Stall.find();
      stall = stalls.find(s => s._id.toString().includes(req.params.id)) || stalls[0];
    }

    stall ? res.json({ success: true, data: stall }) : res.json({ success: false, message: '不存在' });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 获取我的摊位
app.get('/api/stall/my', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.json({ success: false, message: '请先登录' });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user || !user.stallId) {
      return res.json({ success: false, message: '暂无摊位' });
    }

    const stall = await Stall.findById(user.stallId);
    res.json({ success: true, data: stall });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 更新摊位信息
app.put('/api/stall/:id', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.json({ success: false, message: '请先登录' });
  }

  try {
    let stall;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      stall = await Stall.findById(req.params.id);
    } else {
      const stalls = await Stall.find();
      stall = stalls.find(s => s._id.toString().includes(req.params.id)) || stalls[0];
    }

    if (!stall) {
      return res.json({ success: false, message: '摊位不存在' });
    }

    const { name, notice, settings } = req.body;
    if (name) stall.name = name;
    if (notice !== undefined) stall.notice = notice;
    if (settings) stall.settings = { ...stall.settings, ...settings };

    await stall.save();
    res.json({ success: true, data: stall });
  } catch (error) {
    res.json({ success: false, message: '更新失败' });
  }
});

// ===== 商品API =====

// 获取商品列表
app.get('/api/product/stall/:stallId', async (req, res) => {
  try {
    let stallId = req.params.stallId;
    let stall;

    if (stallId.match(/^[0-9a-fA-F]{24}$/)) {
      stall = await Stall.findById(stallId);
    } else {
      const stalls = await Stall.find();
      stall = stalls.find(s => s._id.toString().includes(stallId)) || stalls[0];
    }

    if (!stall) {
      return res.json({ success: true, data: [] });
    }

    const products = await Product.find({ stallId: stall._id, status: 'active' });
    res.json({ success: true, data: products });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// ===== 订单API =====

// 创建订单
app.post('/api/order', async (req, res) => {
  const { stallId, items } = req.body;

  try {
    let stall;
    if (stallId.match(/^[0-9a-fA-F]{24}$/)) {
      stall = await Stall.findById(stallId);
    } else {
      const stalls = await Stall.find();
      stall = stalls.find(s => s._id.toString().includes(stallId)) || stalls[0];
    }

    if (!stall) {
      return res.json({ success: false, message: '摊位不存在' });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 生成订单号
    const prefix = stall.settings?.orderPrefix || 'A';
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}${today.getDate()}`;
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderNumber = `${prefix}${dateStr}${random}`;

    const order = await Order.create({
      stallId: stall._id,
      orderNumber,
      items,
      totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Create order error:', error);
    res.json({ success: false, message: '创建订单失败' });
  }
});

// 发起支付
app.post('/api/order/:id/pay', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.json({ success: false, message: '订单不存在' });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({ success: false, message: '订单已支付' });
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        totalAmount: order.totalAmount,
        mockPay: true
      }
    });
  } catch (error) {
    res.json({ success: false, message: '支付失败' });
  }
});

// 支付回调
app.post('/api/order/:id/payNotify', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.paymentStatus = 'paid';
      order.transactionId = req.body.transactionId || `tx_${Date.now()}`;
      order.paidAt = new Date();
      await order.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

// 获取订单详情
app.get('/api/order/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    order ? res.json({ success: true, data: order }) : res.json({ success: false, message: '订单不存在' });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 获取订单列表
app.get('/api/order/stall/:stallId', async (req, res) => {
  try {
    let stallId = req.params.stallId;
    let stall;

    if (stallId.match(/^[0-9a-fA-F]{24}$/)) {
      stall = await Stall.findById(stallId);
    } else {
      const stalls = await Stall.find();
      stall = stalls.find(s => s._id.toString().includes(stallId)) || stalls[0];
    }

    if (!stall) {
      return res.json({ success: true, data: { list: [], total: 0 } });
    }

    const orders = await Order.find({ stallId: stall._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { list: orders, total: orders.length } });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// 更新订单状态
app.put('/api/order/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    order ? res.json({ success: true, data: order }) : res.json({ success: false });
  } catch (error) {
    res.json({ success: false });
  }
});

// 叫号
app.post('/api/order/:id/call', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', calledAt: new Date() },
      { new: true }
    );
    order ? res.json({ success: true, data: order }) : res.json({ success: false });
  } catch (error) {
    res.json({ success: false });
  }
});

// ===== 统计API =====

// 今日统计
app.get('/api/stats/today/:stallId', async (req, res) => {
  try {
    let stallId = req.params.stallId;
    let stall;

    if (stallId.match(/^[0-9a-fA-F]{24}$/)) {
      stall = await Stall.findById(stallId);
    } else {
      const stalls = await Stall.find();
      stall = stalls.find(s => s._id.toString().includes(stallId)) || stalls[0];
    }

    if (!stall) {
      return res.json({ success: true, data: { orderCount: 0, todayRevenue: 0, pendingCount: 0 } });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const orders = await Order.find({
      stallId: stall._id,
      createdAt: { $gte: startOfDay }
    });

    const orderCount = orders.length;
    const todayRevenue = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;

    res.json({
      success: true,
      data: { orderCount, todayRevenue, pendingCount }
    });
  } catch (error) {
    res.json({ success: false, message: '获取失败' });
  }
});

// Vercel Serverless export
module.exports = app;
