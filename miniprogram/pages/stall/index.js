// pages/stall/index.js
const app = getApp();

Page({
  data: {
    orders: [],
    stall: { name: '加载中...', notice: '' },
    stallId: '',
    stats: {
      orderCount: 0,
      todayRevenue: 0,
      pendingCount: 0
    },
    isLoggedIn: false,
    showQrcodeModal: false,
    qrcodeUrl: '',
    pendingOrders: [],
    cookingOrders: [],
    completedOrders: [],
    showPaymentModal: false,
    paymentAccounts: {
      wechat: { qrcodeUrl: '', name: '', account: '' },
      alipay: { qrcodeUrl: '', name: '', account: '' }
    },
    paymentTab: 'wechat'
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
    const stallId = app.globalData.stallId || '';
    this.setData({ isLoggedIn: true, stallId });
    this.loadData();
  },

  async loadData() {
    const that = this;
    const stallId = app.globalData.stallId;

    // 优先从本地存储加载
    const localStallInfo = wx.getStorageSync('stall_info');
    if (localStallInfo) {
      that.setData({ stall: localStallInfo });
    }

    if (!stallId) return;

    try {
      const db = wx.cloud.database();

      // 加载店铺信息
      try {
        const stallRes = await db.collection('stalls').doc(stallId).get();
        if (stallRes.data) {
          that.setData({
            stall: stallRes.data,
            stallId,
            paymentAccounts: stallRes.data.paymentAccounts || {
              wechat: { qrcodeUrl: '', name: '', account: '' },
              alipay: { qrcodeUrl: '', name: '', account: '' }
            }
          });
          wx.setStorageSync('stall_info', stallRes.data);
        }
      } catch (e) {
        console.log('load stall error:', e);
      }

      // 加载订单列表
      try {
        const ordersRes = await db.collection('orders').where({
          stallId: stallId
        }).orderBy('createdAt', 'desc').get();

        // 格式化订单时间
        const formatTime = (date) => {
          if (!date) return '';
          const d = new Date(date);
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };

        const orders = (ordersRes.data || []).map(o => ({
          ...o,
          createdAt: formatTime(o.createdAt)
        }));
        const pendingOrders = orders.filter(o => o.status === 'pending');
        const cookingOrders = orders.filter(o => o.status === 'cooking');
        const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'taken');
        that.setData({ orders, pendingOrders, cookingOrders, completedOrders });
      } catch (e) {
        console.log('load orders error:', e);
      }

      // 加载统计数据
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const statsRes = await db.collection('orders').where({
          stallId: stallId,
          createdAt: db.command.gte(today)
        }).get();

        const allOrders = statsRes.data || [];
        const orderCount = allOrders.length;
        const todayRevenue = allOrders
          .filter(o => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        const pendingCount = allOrders.filter(o => o.status === 'pending').length;

        that.setData({ stats: { orderCount, todayRevenue, pendingCount } });
      } catch (e) {
        console.log('load stats error:', e);
      }

    } catch (e) {
      console.log('loadData error:', e);
    }
  },

  // 接单
  async acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    try {
      const db = wx.cloud.database();
      await db.collection('orders').doc(orderId).update({
        data: { status: 'cooking' }
      });
      wx.showToast({ title: '已接单', icon: 'success' });
      this.loadData();
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 完成
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
      wx.showToast({ title: '已完成', icon: 'success' });
      this.loadData();
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 叫号
  async callNumber(e) {
    const orderId = e.currentTarget.dataset.id;

    try {
      const db = wx.cloud.database();
      await db.collection('orders').doc(orderId).update({
        data: { calledAt: new Date() }
      });
      wx.showToast({ title: '已叫号', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 显示二维码/分享
  showQrcode() {
    const stallId = app.globalData.stallId;

    if (!stallId) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再操作',
        showCancel: false
      });
      return;
    }

    // 直接调用生成二维码
    this.generateQrcode(stallId);
  },

  // 生成二维码
  async generateQrcode(stallId) {
    wx.showLoading({ title: '生成中...' });

    try {
      const cloudRes = await wx.cloud.callFunction({
        name: 'getMiniCode',
        data: {
          path: 'pages/menu/menu',
          scene: stallId
        }
      });

      console.log('云函数返回:', cloudRes);
      wx.hideLoading();

      const result = cloudRes.result;

      if (result && result.buffer) {
        // 小程序码 - 可以直接打开
        const buffer = result.buffer;
        const filePath = `${wx.env.USER_DATA_PATH}/qrcode.png`;
        const fs = wx.getFileSystemManager();
        fs.writeFileSync(filePath, buffer, 'binary');

        this.setData({
          showQrcodeModal: true,
          qrcodeUrl: filePath
        });
        wx.showToast({ title: '生成成功', icon: 'success' });
      } else if (result && result.scheme) {
        // URL Scheme - 可以直接打开
        const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.scheme)}`;
        this.setData({
          showQrcodeModal: true,
          qrcodeUrl: qrcodeUrl
        });
        wx.showToast({ title: '生成成功', icon: 'success' });
      } else {
        // 需要发布小程序
        wx.showModal({
          title: '需要发布小程序',
          content: '生成可扫码打开的二维码需要先将小程序发布。\n\n目前请通过「右上角...分享小程序」方式让顾客访问点餐页面。',
          confirmText: '我知道了',
          showCancel: false
        });
      }
    } catch (e) {
      console.log('生成失败:', e);
      wx.hideLoading();
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },

  // 隐藏二维码
  hideQrcode() {
    this.setData({ showQrcodeModal: false });
  },

  // 显示收款码
  showPaymentQrcode() {
    if (!app.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.setData({ showPaymentModal: true });
  },

  // 隐藏收款码
  hidePaymentQrcode() {
    this.setData({ showPaymentModal: false });
  },

  // 切换收款码Tab
  switchPaymentTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ paymentTab: tab });
  },

  // 阻止冒泡
  stopPropagation() {},

  // 测试订单
  async testOrder() {
    const stallId = app.globalData.stallId;
    if (!stallId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      const db = wx.cloud.database();
      const stall = this.data.stall;
      const prefix = stall?.settings?.orderPrefix || 'A';

      const now = new Date();
      const orderNumber = `${prefix}${now.getMonth() + 1}${now.getDate()}${Math.floor(Math.random() * 100)}`;

      await db.collection('orders').add({
        data: {
          stallId,
          orderNumber,
          items: [{ name: '鸡蛋灌饼', price: 8, quantity: 1 }],
          totalAmount: 8,
          status: 'pending',
          paymentStatus: 'paid',
          createdAt: new Date()
        }
      });

      wx.showToast({ title: '测试订单已添加', icon: 'success' });
      this.loadData();
    } catch (e) {
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  // 测试叫号
  testCall() {
    wx.showModal({
      title: '测试叫号',
      content: 'A05号请取餐',
      showCancel: false
    });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});
