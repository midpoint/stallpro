// pages/stall/index.js
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    orders: [],
    stats: {
      orderCount: 0,
      todayRevenue: 0,
      pendingCount: 0
    },
    isLoggedIn: false
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (app.isLoggedIn()) {
      this.loadData();
    }
  },

  checkLogin() {
    if (!app.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({ isLoggedIn: true });
    this.loadData();
  },

  loadData() {
    const stallId = app.globalData.stallId || 'stall1';
    const that = this;

    // 加载订单列表
    wx.request({
      url: `${API_BASE}/order/stall/${stallId}`,
      success(res) {
        if (res.data.success) {
          that.setData({ orders: res.data.data.list || [] });
        }
      }
    });

    // 加载统计数据
    wx.request({
      url: `${API_BASE}/stats/today/${stallId}`,
      success(res) {
        if (res.data.success) {
          that.setData({ stats: res.data.data });
        }
      }
    });
  },

  acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const that = this;

    wx.request({
      url: `${API_BASE}/order/${orderId}/status`,
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
    const that = this;

    wx.request({
      url: `${API_BASE}/order/${orderId}/call`,
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

    wx.request({
      url: `${API_BASE}/order/${orderId}/call`,
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
