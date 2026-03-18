// Vercel Serverless 入口
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 模拟数据
const mockData = {
  stalls: [{ _id: '1', name: '老王鸡蛋灌饼', notice: '今日特惠！', settings: { orderPrefix: 'A' } }],
  products: [
    { _id: '1', stallId: '1', name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
    { _id: '2', stallId: '1', name: '手抓饼', price: 10, category: '主食', status: 'active' },
    { _id: '3', stallId: '1', name: '烤冷面', price: 8, category: '主食', status: 'active' }
  ],
  orders: []
};

let orderCounter = 0;
const generateOrderNumber = (prefix = 'A') => {
  orderCounter++;
  return `${prefix}${orderCounter.toString().padStart(2, '0')}`;
};

// API 路由
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: '摆摊助手 API', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/stall/:id', (req, res) => {
  const stall = mockData.stalls.find(s => s._id === req.params.id);
  stall ? res.json({ success: true, data: stall }) : res.json({ success: false, message: '不存在' });
});

app.get('/api/product/stall/:stallId', (req, res) => {
  const products = mockData.products.filter(p => p.stallId === req.params.stallId);
  res.json({ success: true, data: products });
});

app.post('/api/order', (req, res) => {
  const { stallId, items } = req.body;
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    _id: Date.now().toString(),
    stallId,
    orderNumber: generateOrderNumber('A'),
    items,
    totalAmount,
    status: 'pending',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString()
  };
  mockData.orders.push(order);
  res.json({ success: true, data: order });
});

app.get('/api/order/stall/:stallId', (req, res) => {
  const orders = mockData.orders.filter(o => o.stallId === req.params.stallId);
  res.json({ success: true, data: { list: orders, total: orders.length } });
});

app.put('/api/order/:id/status', (req, res) => {
  const { status } = req.body;
  const order = mockData.orders.find(o => o._id === req.params.id);
  order ? (order.status = status, res.json({ success: true, data: order })) : res.json({ success: false });
});

app.post('/api/order/:id/call', (req, res) => {
  const order = mockData.orders.find(o => o._id === req.params.id);
  order ? (order.status = 'completed', order.calledAt = new Date().toISOString(), res.json({ success: true, data: order })) : res.json({ success: false });
});

app.get('/api/stats/today/:stallId', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const orders = mockData.orders.filter(o => o.stallId === req.params.stallId && o.createdAt.startsWith(today));
  res.json({ success: true, data: { orderCount: orders.length, todayRevenue: orders.reduce((s, o) => s + o.totalAmount, 0), pendingCount: orders.filter(o => o.status === 'pending').length } });
});

// Vercel Serverless export
module.exports = app;
