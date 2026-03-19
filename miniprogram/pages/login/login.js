// pages/login/login.js
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    if (app.globalData.token) {
      this.checkLogin();
    }
  },

  handleLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const that = this;

    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: async (userRes) => {
        // 尝试登录
        try {
          // 使用模拟的code（实际需要通过wx.login获取）
          const code = 'demo_' + Date.now();

          wx.request({
            url: `${API_BASE}/auth/login`,
            method: 'POST',
            data: {
              code: code,
              userInfo: userRes.userInfo
            },
            success(res) {
              if (res.data.success) {
                // 保存登录信息
                app.globalData.token = res.data.data.token;
                app.globalData.userInfo = res.data.data.user;
                app.globalData.stallId = res.data.data.user.stallId;

                wx.setStorageSync('token', res.data.data.token);
                wx.setStorageSync('userInfo', res.data.data.user);

                wx.showToast({ title: '登录成功', icon: 'success' });

                // 跳转到首页
                setTimeout(() => {
                  wx.switchTab({ url: '/pages/menu/menu' });
                }, 1000);
              } else {
                wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
              }
            },
            fail(err) {
              console.error('登录失败', err);
              wx.showToast({ title: '网络错误', icon: 'none' });
            },
            complete() {
              that.setData({ loading: false });
            }
          });
        } catch (e) {
          console.error('登录异常', e);
          that.setData({ loading: false });
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.log('用户拒绝授权', err);
        that.setData({ loading: false });
        // 可以使用游客模式继续
        wx.showToast({ title: '需要授权才能使用', icon: 'none' });
      }
    });
  },

  // 检查登录状态
  checkLogin() {
    const that = this;
    wx.request({
      url: `${API_BASE}/auth/me`,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success(res) {
        if (res.data.success) {
          app.globalData.userInfo = res.data.data;
          app.globalData.stallId = res.data.data.stallId;
          wx.switchTab({ url: '/pages/menu/menu' });
        } else {
          // token失效，清除
          app.globalData.token = null;
          wx.removeStorageSync('token');
        }
      },
      fail() {
        app.globalData.token = null;
      }
    });
  }
});
