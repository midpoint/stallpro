// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    stallId: null,
    apiBase: 'http://localhost:3001/api'
  },

  onLaunch(options) {
    // 获取场景值
    console.log('场景值:', options.scene);

    // 从分享链接获取摊位ID
    if (options.query && options.query.stallId) {
      this.globalData.stallId = options.query.stallId;
    }

    // 检查登录状态
    this.checkLogin();
  },

  // 检查登录
  checkLogin() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }
  },

  // 登录
  login(code, userInfo) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBase}/auth/wechat_login`,
        method: 'POST',
        data: { code, userInfo },
        success: (res) => {
          if (res.data.success) {
            this.globalData.token = res.data.data.token;
            this.globalData.userInfo = res.data.data.user;
            wx.setStorageSync('token', res.data.data.token);
            resolve(res.data.data);
          } else {
            reject(res.data.message);
          }
        },
        fail: reject
      });
    });
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: reject
      });
    });
  }
});
