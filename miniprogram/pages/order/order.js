// pages/order/order.js - 订单列表（顾客查看自己的订单）
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    orders: [],
    isOwner: false,  // 是否是摊主
    tab: 'customer'  // customer | owner
  },

  onLoad() {
    // 判断是顾客还是摊主
    this.checkUserRole();
  },

  onShow() {
    this.loadOrders();
  },

  checkUserRole() {
    if (app.isLoggedIn()) {
      // 已登录，可能是摊主
      const userInfo = app.globalData.userInfo;
      if (userInfo && userInfo.stallId) {
        this.setData({ isOwner: true, tab: 'owner' });
      }
    } else {
      this.setData({ isOwner: false, tab: 'customer' });
    }
  },

  loadOrders() {
    const stallId = app.globalData.stallId;

    // 如果是摊主，加载自己商铺的订单
    if (this.data.isOwner && stallId) {
      const that = this;
      wx.request({
        url: `${API_BASE}/order/stall/${stallId}`,
        success(res) {
          if (res.data.success) {
            that.setData({ orders: res.data.data.list || [] });
          }
        }
      });
    } else {
      // 顾客端，暂不显示历史订单（需要存储顾客订单）
      this.setData({ orders: [] });
    }
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
    this.loadOrders();
  },

  // 顾客模式：查看订单详情
  goToDetail(e) {
    const { orderid, stallid } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/detail?orderId=${orderid}&stallId=${stallid}`
    });
  },

  // 摊主模式：接单
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
          that.loadOrders();
        }
      }
    });
  },

  // 摊主模式：完成并叫号
  completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const that = this;

    wx.request({
      url: `${API_BASE}/order/${orderId}/call`,
      method: 'POST',
      success(res) {
        if (res.data.success) {
          wx.showToast({ title: '已叫号', icon: 'success' });
          that.loadOrders();
        }
      }
    });
  },

  onPullDownRefresh() {
    this.loadOrders();
    wx.stopPullDownRefresh();
  }
});
