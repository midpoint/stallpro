// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    stallId: null,
    cloudEnv: 'cloud1-0g8ubqo1e64344a2'
  },

  onLaunch(options) {
    // 初始化云能力
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true
      });
      console.log('云能力初始化成功');
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    }

    // 获取场景值
    console.log('场景值:', options.scene);

    // 从分享链接获取摊位ID
    if (options.query && options.query.stallId) {
      this.globalData.stallId = options.query.stallId;
    }

    // 检查登录状态
    this.checkLogin();
  },

  // 云数据库初始化
  getDb() {
    return wx.cloud.database();
  },

  // 检查登录
  checkLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.globalData.stallId = userInfo?.stallId;
    }
  },

  // 获取用户信息（带自动登录）
  getUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.globalData.userInfo) {
        resolve(this.globalData.userInfo);
      } else {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
          this.globalData.userInfo = userInfo;
          resolve(userInfo);
        } else {
          reject(null);
        }
      }
    });
  },

  // 检查是否已登录
  isLoggedIn() {
    return !!this.globalData.token;
  },

  // 退出登录
  logout() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.stallId = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('stall_info');
  }
});
