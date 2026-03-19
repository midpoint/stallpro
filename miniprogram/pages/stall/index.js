// pages/stall/index.js
const app = getApp();

Page({
  data: {
    orders: [],
    stats: {
      orderCount: 0,
      todayRevenue: 0,
      pendingCount: 0
    }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const baseUrl = 'https://stallpro.vercel.app/api';
    const stallId = '1';
    const that = this;

    // 加载订单列表
    wx.request({
      url: `${baseUrl}/order/stall/${stallId}`,
      success(res) {
        if (res.data.success) {
          that.setData({ orders: res.data.data.list || [] });
        }
      }
    });

    // 加载统计数据
    wx.request({
      url: `${baseUrl}/stats/today/${stallId}`,
      success(res) {
        if (res.data.success) {
          that.setData({ stats: res.data.data });
        }
      }
    });
  },

  acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const baseUrl = 'https://stallpro.vercel.app/api';
    const that = this;

    wx.request({
      url: `${baseUrl}/order/${orderId}/status`,
      method: 'PUT',
      data: { status: 'cooking' },
      success(res) {
        if (res.data.success) {
          wx.showToast({ title: '已接单', icon: 'success' });
          that.loadData();
        }
      }
    });
  },

  completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const baseUrl = 'https://stallpro.vercel.app/api';
    const that = this;

    wx.request({
      url: `${baseUrl}/order/${orderId}/call`,
      method: 'POST',
      success(res) {
        if (res.data.success) {
          wx.showToast({ title: '已完成', icon: 'success' });
          that.loadData();
        }
      }
    });
  },

  callNumber(e) {
    const orderId = e.currentTarget.dataset.id;
    const baseUrl = 'https://stallpro.vercel.app/api';

    wx.request({
      url: `${baseUrl}/order/${orderId}/call`,
      method: 'POST',
      success() {
        wx.showToast({ title: '已叫号', icon: 'success' });
      }
    });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});
