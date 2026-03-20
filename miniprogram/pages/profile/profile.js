// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    stallName: '',
    stats: {
      orderCount: 0,
      todayRevenue: 0,
      pendingCount: 0
    }
  },

  onShow() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    this.setData({ userInfo });

    const stallId = app.globalData.stallId;

    if (userInfo && stallId) {
      try {
        const db = wx.cloud.database();

        // 加载摊位信息
        const stallRes = await db.collection('stalls').doc(stallId).get();
        if (stallRes.data) {
          this.setData({ stallName: stallRes.data.name });
        }

        // 加载今日统计
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersRes = await db.collection('orders').where({
          stallId: stallId,
          createdAt: db.command.gte(today)
        }).get();

        const allOrders = ordersRes.data || [];
        const orderCount = allOrders.length;
        const todayRevenue = allOrders
          .filter(o => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        const pendingCount = allOrders.filter(o => o.status === 'pending').length;

        this.setData({
          stats: { orderCount, todayRevenue, pendingCount }
        });
      } catch (e) {
        console.log('load error:', e);
      }
    }
  },

  goToStall() {
    wx.switchTab({
      url: '/pages/stall/index'
    });
  },

  goToProducts() {
    wx.navigateTo({
      url: '/pages/products/products'
    });
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  goToStats() {
    wx.navigateTo({
      url: '/pages/stats/stats'
    });
  },

  goToPaymentAccounts() {
    wx.navigateTo({
      url: '/pages/shop/paymentAccounts'
    });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});
