// server/api/order.js - 订单API (Vercel Serverless)
const connectDB = require('../config/database');

module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    const { method, query, body } = req;
    const orderNumber = query.orderNumber;

    // 模拟数据（实际需要从MongoDB获取）
    const mockOrders = [
      {
        id: '1',
        orderNumber: 'A01',
        items: [{ name: '鸡蛋灌饼', price: 8, quantity: 1 }],
        totalAmount: 8,
        status: 'pending',
        paymentStatus: 'paid'
      }
    ];

    if (method === 'GET') {
      if (orderNumber) {
        // 查询单个订单
        const order = mockOrders.find(o => o.orderNumber === orderNumber);
        return res.status(200).json({
          success: true,
          data: order || null
        });
      }
      // 返回订单列表
      return res.status(200).json({
        success: true,
        data: mockOrders
      });
    }

    if (method === 'POST') {
      // 创建订单
      return res.status(201).json({
        success: true,
        message: '订单创建成功（模拟）',
        data: {
          id: Date.now().toString(),
          orderNumber: 'A' + String(Math.floor(Math.random() * 99) + 1).padStart(2, '0'),
          ...body,
          status: 'pending',
          paymentStatus: 'paid',
          createdAt: new Date().toISOString()
        }
      });
    }

    res.status(405).json({ success: false, message: '方法不允许' });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
