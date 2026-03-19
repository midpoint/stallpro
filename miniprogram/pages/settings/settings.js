// pages/settings/settings.js
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    stall: {
      name: '加载中...',
      notice: '',
      settings: { orderPrefix: 'A' }
    },
    settings: {
      newOrderNotify: true,
      autoAccept: false,
      wechatPay: true,
      alipay: false,
      nightMode: false
    },
    showModal: false,
    modalTitle: '',
    modalType: '',
    modalValue: ''
  },

  onLoad() {
    this.loadSettings();
  },

  loadSettings() {
    let stallId = app.globalData.stallId || 'stall1';
    stallId = stallId.toString().trim();
    const that = this;

    // 优先从本地存储加载店铺信息
    const localStallInfo = wx.getStorageSync('stall_info');
    if (localStallInfo) {
      that.setData({ stall: localStallInfo });
    }

    // 从本地存储加载设置
    const localSettings = wx.getStorageSync('stall_settings');
    if (localSettings) {
      this.setData({ settings: localSettings });
    }

    // 再从API获取最新数据
    wx.request({
      url: `${API_BASE}/stall/${stallId}`,
      success(res) {
        if (res.data.success && res.data.data) {
          that.setData({ stall: res.data.data });
          // 更新本地存储
          wx.setStorageSync('stall_info', res.data.data);
        }
      }
    });
  },

  // 编辑店铺名称
  editName() {
    this.setData({
      showModal: true,
      modalTitle: '店铺名称',
      modalType: 'name',
      modalValue: this.data.stall.name
    });
  },

  // 编辑店铺公告
  editNotice() {
    this.setData({
      showModal: true,
      modalTitle: '店铺公告',
      modalType: 'notice',
      modalValue: this.data.stall.notice || ''
    });
  },

  // 编辑取餐号前缀
  editPrefix() {
    this.setData({
      showModal: true,
      modalTitle: '取餐号前缀',
      modalType: 'prefix',
      modalValue: this.data.stall.settings?.orderPrefix || 'A'
    });
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({ showModal: false });
  },

  // 阻止冒泡
  stopPropagation() {},

  // 输入弹窗值
  inputModalValue(e) {
    this.setData({ modalValue: e.detail.value });
  },

  // 确认弹窗
  confirmModal() {
    const { modalType, modalValue } = this.data;
    const stall = this.data.stall;

    if (modalType === 'name') {
      stall.name = modalValue;
    } else if (modalType === 'notice') {
      stall.notice = modalValue;
    } else if (modalType === 'prefix') {
      stall.settings = stall.settings || {};
      stall.settings.orderPrefix = modalValue;
    }

    this.setData({ stall, showModal: false });
  },

  // 切换新订单提醒
  toggleNotify(e) {
    this.setData({ 'settings.newOrderNotify': e.detail.value });
  },

  // 切换自动接单
  toggleAutoAccept(e) {
    this.setData({ 'settings.autoAccept': e.detail.value });
  },

  // 切换微信支付
  toggleWechatPay(e) {
    this.setData({ 'settings.wechatPay': e.detail.value });
  },

  // 切换支付宝
  toggleAlipay(e) {
    this.setData({ 'settings.alipay': e.detail.value });
  },

  // 切换夜间模式
  toggleNightMode(e) {
    this.setData({ 'settings.nightMode': e.detail.value });
  },

  // 显示关于
  showAbout() {
    wx.showModal({
      title: '关于摆摊666',
      content: '版本：1.0.0\n边做边卖、边接单、边收款、叫号不用喊',
      showCancel: false
    });
  },

  // 保存设置
  saveSettings() {
    // 保存到本地存储
    wx.setStorageSync('stall_settings', this.data.settings);

    // 保存店铺信息到本地
    const stallInfo = {
      name: this.data.stall.name,
      notice: this.data.stall.notice,
      settings: this.data.stall.settings
    };
    wx.setStorageSync('stall_info', stallInfo);

    wx.showToast({ title: '保存成功', icon: 'success' });

    // 尝试发送到后端（不阻塞UI）
    try {
      let stallId = app.globalData.stallId || 'stall1';
      stallId = stallId.toString().trim();

      wx.request({
        url: `${API_BASE}/stall/${stallId}`,
        method: 'PUT',
        data: stallInfo,
        fail: function() {}
      });
    } catch(e) {}
  }
});
