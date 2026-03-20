// pages/stats/stats.js - 数据分析报表
const app = getApp();

Page({
  data: {
    tab: 'today',  // today | week | month
    summary: {
      orderCount: 0,
      revenue: 0,
      avgOrderValue: 0
    },
    trend: [],
    topProducts: [],
    peakHours: []
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadStats();
    wx.stopPullDownRefresh();
  },

  // Tab切换
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
    this.loadStats();
  },

  // 加载统计数据
  async loadStats() {
    const tab = this.data.tab;
    const stallId = app.globalData.stallId;

    if (!stallId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const db = wx.cloud.database();
    const now = new Date();
    let startDate;

    // 计算开始日期
    if (tab === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (tab === 'week') {
      const dayOfWeek = now.getDay() || 7;
      startDate = new Date(now.getTime() - (dayOfWeek - 1) * 86400000);
      startDate.setHours(0, 0, 0, 0);
    } else if (tab === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    try {
      // 查询订单
      const ordersRes = await db.collection('orders').where({
        stallId,
        createdAt: db.command.gte(startDate)
      }).get();

      const orders = ordersRes.data || [];
      this.calculateSummary(orders);
      this.calculateTrend(orders, tab);
      this.calculateTopProducts(orders);
      this.calculatePeakHours(orders, tab);
    } catch (e) {
      console.log('loadStats error:', e);
    }
  },

  // 计算汇总数据
  calculateSummary(orders) {
    const orderCount = orders.length;
    const revenue = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = orderCount > 0 ? (revenue / orderCount).toFixed(2) : 0;

    this.setData({
      summary: { orderCount, revenue, avgOrderValue }
    });
  },

  // 计算营收趋势
  calculateTrend(orders, tab) {
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const days = tab === 'today' ? 1 : tab === 'week' ? 7 : 30;
    const now = new Date();

    // 按日期分组
    const dateMap = {};
    paidOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      dateMap[dateStr] = (dateMap[dateStr] || 0) + order.totalAmount;
    });

    // 生成趋势数据
    const trend = [];
    let maxRevenue = 0;

    if (days === 1) {
      // 今日：按小时显示
      const hourMap = {};
      paidOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + order.totalAmount;
      });
      for (let h = 0; h <= now.getHours(); h++) {
        const revenue = hourMap[h] || 0;
        maxRevenue = Math.max(maxRevenue, revenue);
        trend.push({
          date: `${h}:00`,
          dateStr: `${h}:00`,
          revenue
        });
      }
    } else {
      // 本周/本月：按天显示
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
        const revenue = dateMap[dateStr] || 0;
        maxRevenue = Math.max(maxRevenue, revenue);
        trend.push({
          date: dateStr,
          dateStr: dateStr,
          revenue
        });
      }
    }

    // 计算百分比
    trend.forEach(item => {
      item.percent = maxRevenue > 0 ? (item.revenue / maxRevenue * 100) : 0;
    });

    this.setData({ trend });
  },

  // 计算热销商品
  calculateTopProducts(orders) {
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const productMap = {};

    paidOrders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!productMap[item.name]) {
          productMap[item.name] = {
            name: item.name,
            icon: item.icon || '🍽️',
            count: 0,
            revenue: 0
          };
        }
        productMap[item.name].count += item.quantity || 1;
        productMap[item.name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.setData({ topProducts });
  },

  // 计算高峰时段
  calculatePeakHours(orders, tab) {
    const hourMap = {};

    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourMap)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        hourStr: `${hour}:00-${hour + 1}:00`,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 计算百分比
    const maxCount = peakHours.length > 0 ? peakHours[0].count : 0;
    peakHours.forEach(item => {
      item.percent = maxCount > 0 ? (item.count / maxCount * 100) : 0;
    });

    this.setData({ peakHours });
  }
});
