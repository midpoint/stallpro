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

  // 摊主登录
  handleOwnerLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const that = this;

    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: async (userRes) => {
        try {
          const code = 'owner_' + Date.now();

          wx.request({
            url: `${API_BASE}/auth/login`,
            method: 'POST',
            data: {
              code: code,
              userInfo: userRes.userInfo
            },
            success(res) {
              if (res.data.success) {
                app.globalData.token = res.data.data.token;
                app.globalData.userInfo = res.data.data.user;
                app.globalData.stallId = res.data.data.user.stallId;

                wx.setStorageSync('token', res.data.data.token);
                wx.setStorageSync('userInfo', res.data.data.user);

                wx.showToast({ title: '登录成功', icon: 'success' });

                setTimeout(() => {
                  wx.switchTab({ url: '/pages/stall/index' });
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
      fail: () => {
        that.setData({ loading: false });
        wx.showToast({ title: '需要授权才能管理店铺', icon: 'none' });
      }
    });
  },

  // 顾客直接点餐（模拟扫码）
  goToMenu() {
    // 模拟扫码进入，使用默认摊位
    wx.switchTab({ url: '/pages/menu/menu' });
  }
});
