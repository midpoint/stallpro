// pages/stall/index.js - 摊主端订单管理
const app = getApp();
const api = require('../../api/api.js');

Page({
  data: {
    orders: [],
    loading: false,
    stats: {
      orderCount: 0,
      todayRevenue: 0,
      pendingCount: 0
    },
    currentTab: 'all',
    socketConnected: false
  },

  onLoad() {
    // 检查是否已登录
    if (!app.globalData.token) {
      this.doLogin();
    } else {
      this.loadData();
    }
  },

  onShow() {
    if (app.globalData.token) {
      this.loadOrders();
      this.connectWebSocket();
    }
  },

  onHide() {
    // 断开WebSocket
    this.setData({ socketConnected: false });
  },

  // 登录
  doLogin() {
    wx.login({
      success: (res) => {
        app.getUserProfile().then(userInfo => {
          app.login(res.code, userInfo).then(() => {
            this.loadData();
          }).catch(err => {
            wx.showToast({ title: '登录失败', icon: 'none' });
          });
        }).catch(() => {
          // 用户拒绝授权，使用游客模式
          this.loadData();
        });
      }
    });
  },

  // 加载数据
  loadData() {
    this.loadMyStalls();
    this.loadOrders();
    this.loadStats();
    this.connectWebSocket();
  },

  // 获取我的摊位
  loadMyStalls() {
    api.getMyStalls().then(res => {
      if (res.success && res.data.length > 0) {
        app.globalData.stallId = res.data[0]._id;
        this.setData({ stall: res.data[0] });
      }
    });
  },

  // 加载订单
  loadOrders() {
    if (!app.globalData.stallId) return;

    this.setData({ loading: true });
    api.getStallOrders(app.globalData.stallId, this.data.currentTab === 'all' ? '' : this.data.currentTab)
      .then(res => {
        if (res.success) {
          this.setData({
            orders: res.data.list,
            loading: false
          });
        }
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  // 加载统计
  loadStats() {
    if (!app.globalData.stallId) return;

    api.getTodayStats(app.globalData.stallId).then(res => {
      if (res.success) {
        this.setData({ stats: res.data });
      }
    });
  },

  // 连接WebSocket
  connectWebSocket() {
    if (!app.globalData.stallId) return;

    const socketUrl = `ws://localhost:3001`;
    // 实际项目中需要使用wx.connectSocket
    // 这里仅作示例

    this.setData({ socketConnected: true });
    wx.showToast({ title: '已连接', icon: 'success', duration: 1000 });
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab }, () => {
      this.loadOrders();
    });
  },

  // 接单
  acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showLoading({ title: '处理中...' });

    api.updateOrderStatus(orderId, 'cooking').then(res => {
      wx.hideLoading();
      if (res.success) {
        wx.showToast({ title: '已接单', icon: 'success' });
        this.loadOrders();
        this.loadStats();
      }
    }).catch(() => {
      wx.hideLoading();
    });
  },

  // 完成并叫号
  completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认完成',
      content: '是否叫号取餐？',
      success: (res) => {
        if (res.confirm) {
          api.callOrder(orderId).then(() => {
            wx.showToast({ title: '已叫号', icon: 'success' });
            this.loadOrders();
            this.loadStats();
          });
        }
      }
    });
  },

  // 叫号
  callNumber(e) {
    const orderId = e.currentTarget.dataset.id;

    api.callOrder(orderId).then(() => {
      wx.showToast({ title: '已叫号', icon: 'success' });
      this.loadOrders();
    });
  },

  // 刷新
  onPullDownRefresh() {
    this.loadOrders();
    this.loadStats();
    wx.stopPullDownRefresh();
  }
});
