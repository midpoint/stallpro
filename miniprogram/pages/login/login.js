// pages/login/login.js
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    loading: false
  },

  onLoad() {
    // 已登录则直接跳转
    if (app.isLoggedIn()) {
      wx.switchTab({ url: '/pages/stall/index' });
    }
  },

  // 摊主登录 - 微信授权
  handleOwnerLogin() {
    if (this.data.loading) return;

    const that = this;

    // 先尝试获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料和登录',
      success: function(userRes) {
        that.doLogin(userRes.userInfo);
      },
      fail: function(err) {
        console.log('getUserProfile fail:', err);
        // 如果用户拒绝，尝试使用模拟登录
        wx.showModal({
          title: '授权提示',
          content: '需要授权微信头像和昵称才能登录管理店铺，是否使用游客模式？',
          success: function(res) {
            if (res.confirm) {
              that.doLogin({ nickName: '摊主' });
            }
          }
        });
      }
    });
  },

  // 执行登录
  doLogin(userInfo) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const that = this;

    // 生成唯一标识
    const code = 'owner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    wx.showLoading({ title: '登录中...' });

    wx.request({
      url: `${API_BASE}/auth/login`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        code: code,
        userInfo: userInfo || {}
      },
      success(res) {
        console.log('Login response:', res.data);

        if (res.data.success && res.data.data) {
          // 保存登录信息
          app.globalData.token = res.data.data.token;
          app.globalData.userInfo = res.data.data.user;
          app.globalData.stallId = res.data.data.user.stallId;

          wx.setStorageSync('token', res.data.data.token);
          wx.setStorageSync('userInfo', res.data.data.user);

          wx.hideLoading();
          wx.showToast({ title: '登录成功', icon: 'success' });

          setTimeout(() => {
            wx.switchTab({ url: '/pages/stall/index' });
          }, 1500);
        } else {
          wx.hideLoading();
          wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
          that.setData({ loading: false });
        }
      },
      fail(err) {
        console.error('Login request fail:', err);
        wx.hideLoading();
        wx.showToast({ title: '网络错误，请检查网络', icon: 'none' });
        that.setData({ loading: false });
      }
    });
  },

  // 顾客直接点餐（模拟扫码）
  goToMenu() {
    wx.switchTab({ url: '/pages/menu/menu' });
  }
});
