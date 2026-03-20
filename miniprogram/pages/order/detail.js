// pages/order/detail.js
Page({
  data: {
    order: {},
    stallId: '',
    statusText: '等待接单',
    statusIcon: '⏳'
  },

  onLoad(options) {
    const { orderId, stallId } = options;
    if (orderId && stallId) {
      this.setData({ stallId });
      this.loadOrder(orderId);
    }
  },

  onShow() {
    const { order } = this.data;
    if (order._id) {
      this.loadOrder(order._id);
    }
  },

  async loadOrder(orderId) {
    const that = this;

    try {
      const db = wx.cloud.database();
      const res = await db.collection('orders').doc(orderId).get();

      if (res.data) {
        that.setData({ order: res.data });
        that.updateStatus(res.data.status);
      }
    } catch (e) {
      console.log('loadOrder error:', e);
    }
  },

  updateStatus(status) {
    const statusMap = {
      'pending': { text: '等待接单', icon: '⏳' },
      'cooking': { text: '制作中', icon: '🍳' },
      'completed': { text: '已完成', icon: '✅' },
      'taken': { text: '已取餐', icon: '🎉' }
    };
    const info = statusMap[status] || { text: '未知状态', icon: '❓' };
    this.setData({
      statusText: info.text,
      statusIcon: info.icon
    });
  },

  refreshOrder() {
    const { order } = this.data;
    if (order._id) {
      this.loadOrder(order._id);
      wx.showToast({ title: '已刷新', icon: 'success' });
    }
  },

  onPullDownRefresh() {
    const { order } = this.data;
    if (order._id) {
      this.loadOrder(order._id);
    }
    wx.stopPullDownRefresh();
  }
});
