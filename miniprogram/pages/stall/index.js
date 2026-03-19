// pages/stall/index.js
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    orders: [],
    stall: { name: '加载中...', notice: '' },
    stallId: 'stall1',
    stats: {
      orderCount: 0,
      todayRevenue: 0,
      pendingCount: 0
    },
    isLoggedIn: false,
    showQrcodeModal: false,
    // 分类订单
    pendingOrders: [],
    cookingOrders: [],
    completedOrders: []
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
    const stallId = app.globalData.stallId || 'stall1';
    this.setData({ isLoggedIn: true, stallId });
    this.loadData();
  },

  loadData() {
    const stallId = app.globalData.stallId || this.data.stallId || 'stall1';
    const that = this;

    // 加载店铺信息
    wx.request({
      url: `${API_BASE}/stall/${stallId}`,
      success(res) {
        if (res.data.success) {
          that.setData({ stall: res.data.data });
        }
      }
    });

    // 加载订单列表
    wx.request({
      url: `${API_BASE}/order/stall/${stallId}`,
      success(res) {
        if (res.data.success) {
          const orders = res.data.data.list || [];
          // 分类订单
          const pendingOrders = orders.filter(o => o.status === 'pending');
          const cookingOrders = orders.filter(o => o.status === 'cooking');
          const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'taken');
          that.setData({ orders, pendingOrders, cookingOrders, completedOrders });
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

  // 接单
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

  // 完成
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

  // 叫号
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

  // 显示二维码
  showQrcode() {
    this.setData({ showQrcodeModal: true });
  },

  // 隐藏二维码
  hideQrcode() {
    this.setData({ showQrcodeModal: false });
  },

  // 去商品管理
  goToProducts() {
    wx.navigateTo({ url: '/pages/products/products' });
  },

  // 去设置
  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  // 测试订单
  testOrder() {
    const that = this;
    wx.request({
      url: `${API_BASE}/order`,
      method: 'POST',
      data: {
        stallId: this.data.stallId || 'stall1',
        items: [{ id: 'p1', name: '鸡蛋灌饼', price: 8, quantity: 1 }]
      },
      success(res) {
        if (res.data.success) {
          wx.showToast({ title: '测试订单已添加', icon: 'success' });
          that.loadData();
        }
      }
    });
  },

  // 测试叫号
  testCall() {
    wx.showModal({
      title: '测试叫号',
      content: 'A05号请取餐',
      showCancel: false,
      success() {
        // 语音播报
        const tts = wx.getBackgroundAudioManager();
        tts.title = '叫号';
        tts.src = 'https://tts.baidu.com/text2audio?cuid=baike&lan=zh&ctp=1&pdt=301&vol=5&rat=24&per=0&spd=5&txt=A05号请取餐';
      }
    });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});
