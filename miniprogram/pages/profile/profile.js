// pages/profile/profile.js
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    userInfo: null,
    stallName: ''
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    this.setData({ userInfo });

    // 加载摊位信息
    if (userInfo && userInfo.stallId) {
      wx.request({
        url: `${API_BASE}/stall/${userInfo.stallId}`,
        success: (res) => {
          if (res.data.success) {
            this.setData({ stallName: res.data.data.name });
          }
        }
      });
    }
  },

  goToStall() {
    wx.navigateTo({
      url: '/pages/stall/index'
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
