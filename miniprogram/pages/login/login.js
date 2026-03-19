// pages/login/login.js
const app = getApp();
const cloudApi = require('../../utils/cloudApi.js');

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

  // 执行登录（使用云数据库）
  async doLogin(userInfo) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    wx.showLoading({ title: '登录中...' });

    try {
      // 获取openid（云开发自动获取）
      const cloudContext = wx.cloud;
      const openid = cloudContext.getAccountIdSync?.() || 'anonymous';

      // 查找或创建用户
      let user;
      try {
        const db = wx.cloud.database();
        const users = await db.collection('users').where({
          _openid: '{openid}'
        }).get();

        if (users.data.length > 0) {
          user = users.data[0];
          // 更新用户信息
          await db.collection('users').doc(user._id).update({
            data: {
              nickname: userInfo?.nickName || user.nickname,
              avatar: userInfo?.avatarUrl || user.avatar
            }
          });
        } else {
          // 创建新用户
          const newUser = {
            nickname: userInfo?.nickName || '新用户',
            avatar: userInfo?.avatarUrl || '',
            role: 'owner',
            stallId: null,
            createdAt: new Date()
          };
          const result = await db.collection('users').add({
            data: newUser
          });
          user = { ...newUser, _id: result._id };
        }
      } catch (e) {
        console.error('User操作失败:', e);
        // 使用本地模拟用户
        user = { _id: 'local_user', nickname: userInfo?.nickName || '用户' };
      }

      // 检查是否有摊位
      let stall = null;
      try {
        const db = wx.cloud.database();
        const stalls = await db.collection('stalls').where({
          _openid: '{openid}'
        }).get();

        if (stalls.data.length > 0) {
          stall = stalls.data[0];
        } else {
          // 创建新摊位
          const newStall = {
            name: user.nickname + '的店铺',
            notice: '欢迎光临！',
            settings: { orderPrefix: 'A' },
            status: 'active',
            createdAt: new Date()
          };
          const result = await db.collection('stalls').add({
            data: newStall
          });
          stall = { ...newStall, _id: result._id };

          // 更新用户的stallId
          await db.collection('users').doc(user._id).update({
            data: { stallId: stall._id }
          });
          user.stallId = stall._id;

          // 创建默认商品
          const defaultProducts = [
            { stallId: stall._id, name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
            { stallId: stall._id, name: '手抓饼', price: 10, category: '主食', status: 'active' },
            { stallId: stall._id, name: '烤冷面', price: 8, category: '主食', status: 'active' }
          ];
          for (const p of defaultProducts) {
            await db.collection('products').add({ data: p });
          }
        }
      } catch (e) {
        console.error('Stall操作失败:', e);
        // 使用默认摊位
        stall = { _id: 'stall1', name: '老王鸡蛋灌饼', notice: '今日特惠：加肠免费！', settings: { orderPrefix: 'A' } };
      }

      // 保存登录信息
      app.globalData.token = 'cloud_token_' + user._id;
      app.globalData.userInfo = user;
      app.globalData.stallId = stall._id;

      wx.setStorageSync('token', app.globalData.token);
      wx.setStorageSync('userInfo', user);
      wx.setStorageSync('stall_info', stall);

      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });

      setTimeout(() => {
        wx.switchTab({ url: '/pages/stall/index' });
      }, 1500);

    } catch (err) {
      console.error('登录失败:', err);
      wx.hideLoading();
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 顾客直接点餐（模拟扫码）
  goToMenu() {
    wx.switchTab({ url: '/pages/menu/menu' });
  }
});
