// pages/order/detail.js
const API_BASE = 'https://stallpro.vercel.app/api';

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

  loadOrder(orderId) {
    const that = this;
    wx.request({
      url: `${API_BASE}/order/${orderId}`,
      success(res) {
        if (res.data.success) {
          const order = res.data.data;
          that.setData({ order });
          that.updateStatus(order.status);
        }
      }
    });
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
