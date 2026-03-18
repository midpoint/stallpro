require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 模拟数据存储（用于无数据库演示）
const mockData = {
  stalls: [
    { _id: '1', name: '老王鸡蛋灌饼', ownerId: 'user1', notice: '今日特惠：加肠免费！', settings: { orderPrefix: 'A' } }
  ],
  products: [
    { _id: '1', stallId: '1', name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
    { _id: '2', stallId: '1', name: '手抓饼', price: 10, category: '主食', status: 'active' },
    { _id: '3', stallId: '1', name: '烤冷面', price: 8, category: '主食', status: 'active' },
    { _id: '4', stallId: '1', name: '烤肠', price: 2, category: '小吃', status: 'active' }
  ],
  orders: []
};

// 生成取餐号
let orderCounter = 0;
const generateOrderNumber = (prefix = 'A') => {
  orderCounter++;
  return `${prefix}${orderCounter.toString().padStart(2, '0')}`;
};

// Socket.io 配置
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  socket.on('join_stall', (stallId) => {
    socket.join(`stall_${stallId}`);
    console.log(`Socket ${socket.id} 加入摊位 ${stallId}`);
  });

  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });
});

// API 路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 获取摊位信息
app.get('/api/stall/:id', (req, res) => {
  const stall = mockData.stalls.find(s => s._id === req.params.id);
  if (stall) {
    res.json({ success: true, data: stall });
  } else {
    res.json({ success: false, message: '摊位不存在' });
  }
});

// 获取商品列表
app.get('/api/product/stall/:stallId', (req, res) => {
  const products = mockData.products.filter(p => p.stallId === req.params.stallId && p.status === 'active');
  res.json({ success: true, data: products });
});

// 创建订单
app.post('/api/order', (req, res) => {
  const { stallId, items } = req.body;

  // 计算总价
  let totalAmount = 0;
  const orderItems = items.map(item => {
    const subtotal = item.price * item.quantity;
    totalAmount += subtotal;
    return { ...item, subtotal };
  });

  const stall = mockData.stalls.find(s => s._id === stallId);
  const prefix = stall?.settings?.orderPrefix || 'A';

  const order = {
    _id: Date.now().toString(),
    stallId,
    orderNumber: generateOrderNumber(prefix),
    items: orderItems,
    totalAmount,
    status: 'pending',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString()
  };

  mockData.orders.push(order);

  // 通知摊主
  io.to(`stall_${stallId}`).emit('new_order', order);

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

  if (order) {
    order.status = status;
    if (status === 'completed') {
      order.calledAt = new Date().toISOString();
      io.to(`stall_${order.stallId}`).emit('order_called', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    }
    res.json({ success: true, data: order });
  } else {
    res.json({ success: false, message: '订单不存在' });
  }
});

// 叫号
app.post('/api/order/:id/call', (req, res) => {
  const order = mockData.orders.find(o => o._id === req.params.id);

  if (order) {
    order.status = 'completed';
    order.calledAt = new Date().toISOString();

    io.to(`stall_${order.stallId}`).emit('order_called', {
      orderId: order._id,
      orderNumber: order.orderNumber
    });

    res.json({ success: true, data: order });
  } else {
    res.json({ success: false, message: '订单不存在' });
  }
});

// 今日统计
app.get('/api/stats/today/:stallId', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const orders = mockData.orders.filter(o =>
    o.stallId === req.params.stallId &&
    o.createdAt.startsWith(today)
  );

  const orderCount = orders.length;
  const todayRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  res.json({
    success: true,
    data: {
      orderCount,
      todayRevenue,
      pendingCount: orders.filter(o => o.status === 'pending').length
    }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket 运行在 ws://localhost:${PORT}`);
  console.log(`示例摊位ID: 1`);
});

module.exports = { app, io };
