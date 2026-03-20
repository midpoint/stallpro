// pages/order/order.js - 订单列表（顾客查看自己的订单）
const app = getApp();

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

  async loadOrders() {
    const stallId = app.globalData.stallId;
    const that = this;

    // 如果是摊主，加载自己商铺的订单
    if (this.data.isOwner && stallId) {
      try {
        const db = wx.cloud.database();
        const ordersRes = await db.collection('orders').where({
          stallId: stallId
        }).orderBy('createdAt', 'desc').get();

        that.setData({ orders: ordersRes.data || [] });
      } catch (e) {
        console.log('loadOrders error:', e);
      }
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
  async acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    try {
      const db = wx.cloud.database();
      await db.collection('orders').doc(orderId).update({
        data: { status: 'cooking' }
      });
      wx.showToast({ title: '已接单', icon: 'success' });
      this.loadOrders();
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 摊主模式：完成并叫号
  async completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    try {
      const db = wx.cloud.database();
      await db.collection('orders').doc(orderId).update({
        data: {
          status: 'completed',
          calledAt: new Date()
        }
      });
      wx.showToast({ title: '已叫号', icon: 'success' });
      this.loadOrders();
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onPullDownRefresh() {
    this.loadOrders();
    wx.stopPullDownRefresh();
  }
});
