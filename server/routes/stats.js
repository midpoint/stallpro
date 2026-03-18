const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// 获取今日统计
router.get('/today/:stallId', auth, async (req, res) => {
  try {
    const { stallId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 今日订单数
    const orderCount = await Order.countDocuments({
      stallId,
      createdAt: { $gte: today }
    });

    // 今日营收
    const revenueResult = await Order.aggregate([
      {
        $match: {
          stallId,
          createdAt: { $gte: today },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' }
        }
      }
    ]);
    const todayRevenue = revenueResult[0]?.total || 0;

    // 今日已完成订单
    const completedCount = await Order.countDocuments({
      stallId,
      status: { $in: ['completed', 'taken'] },
      createdAt: { $gte: today }
    });

    // 待制作订单
    const pendingCount = await Order.countDocuments({
      stallId,
      status: { $in: ['pending', 'cooking'] }
    });

    res.json({
      success: true,
      data: {
        orderCount,
        todayRevenue,
        completedCount,
        pendingCount,
        avgOrderValue: orderCount > 0 ? (todayRevenue / orderCount).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 获取订单趋势
router.get('/trend/:stallId', auth, async (req, res) => {
  try {
    const { stallId } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const trend = await Order.aggregate([
      {
        $match: {
          stallId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 补齐没有数据的日期
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const found = trend.find(t => t._id === dateStr);
      result.unshift({
        date: dateStr,
        count: found?.count || 0,
        revenue: found?.revenue || 0
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 获取热销商品
router.get('/top-products/:stallId', auth, async (req, res) => {
  try {
    const { stallId } = req.params;
    const { days = 30, limit = 10 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // 获取订单中的商品统计
    const topProducts = await Order.aggregate([
      {
        $match: {
          stallId,
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 获取时段统计
router.get('/hours/:stallId', auth, async (req, res) => {
  try {
    const { stallId } = req.params;
    const { date } = req.query;

    const matchDate = date ? new Date(date) : new Date();
    matchDate.setHours(0, 0, 0, 0);
    const endDate = new Date(matchDate);
    endDate.setDate(endDate.getDate() + 1);

    const hourlyStats = await Order.aggregate([
      {
        $match: {
          stallId,
          createdAt: { $gte: matchDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 补齐所有时段
    const result = [];
    for (let i = 6; i <= 23; i++) { // 假设营业时间 6:00-23:00
      const found = hourlyStats.find(s => s._id === i);
      result.push({
        hour: i,
        count: found?.count || 0,
        revenue: found?.revenue || 0
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

module.exports = router;
