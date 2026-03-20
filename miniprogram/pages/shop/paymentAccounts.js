// pages/shop/paymentAccounts.js - 收款账户设置
const app = getApp();

Page({
  data: {
    accounts: {
      wechat: {
        enabled: false,
        name: '',
        account: '',
        qrcodeUrl: ''
      },
      alipay: {
        enabled: false,
        name: '',
        account: '',
        qrcodeUrl: ''
      }
    }
  },

  onLoad() {
    this.loadAccounts();
  },

  async loadAccounts() {
    const stallId = app.globalData.stallId;
    if (!stallId) return;

    try {
      const db = wx.cloud.database();
      const res = await db.collection('stalls').doc(stallId).get();

      if (res.data && res.data.paymentAccounts) {
        this.setData({
          accounts: res.data.paymentAccounts
        });
      }
    } catch (e) {
      console.log('loadAccounts error:', e);
    }
  },

  toggleWechat(e) {
    const enabled = e.detail.value;
    this.setData({
      'accounts.wechat.enabled': enabled
    });
  },

  toggleAlipay(e) {
    const enabled = e.detail.value;
    this.setData({
      'accounts.alipay.enabled': enabled
    });
  },

  editWechatName() {
    wx.showModal({
      title: '收款人姓名',
      editable: true,
      placeholderText: '请输入微信收款人姓名',
      content: this.data.accounts.wechat.name || '',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'accounts.wechat.name': res.content.trim()
          });
        }
      }
    });
  },

  editWechatAccount() {
    wx.showModal({
      title: '收款账号',
      editable: true,
      placeholderText: '请输入微信收款账号',
      content: this.data.accounts.wechat.account || '',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'accounts.wechat.account': res.content.trim()
          });
        }
      }
    });
  },

  editAlipayName() {
    wx.showModal({
      title: '收款人姓名',
      editable: true,
      placeholderText: '请输入支付宝收款人姓名',
      content: this.data.accounts.alipay.name || '',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'accounts.alipay.name': res.content.trim()
          });
        }
      }
    });
  },

  editAlipayAccount() {
    wx.showModal({
      title: '收款账号',
      editable: true,
      placeholderText: '请输入支付宝收款账号',
      content: this.data.accounts.alipay.account || '',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'accounts.alipay.account': res.content.trim()
          });
        }
      }
    });
  },

  uploadWechatQrcode() {
    this.uploadQrcode('wechat');
  },

  uploadAlipayQrcode() {
    this.uploadQrcode('alipay');
  },

  uploadQrcode(type) {
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const filePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });

        try {
          const stallId = app.globalData.stallId;
          const cloudPath = `payment_qrcodes/${stallId}_${type}_${Date.now()}.png`;

          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath
          });

          this.setData({
            [`accounts.${type}.qrcodeUrl`]: uploadRes.fileID
          });

          wx.hideLoading();
          wx.showToast({ title: '上传成功', icon: 'success' });
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
          console.log('upload error:', e);
        }
      }
    });
  },

  async saveAccounts() {
    const stallId = app.globalData.stallId;
    if (!stallId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      const db = wx.cloud.database();
      await db.collection('stalls').doc(stallId).update({
        data: {
          paymentAccounts: this.data.accounts
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
      console.log('saveAccounts error:', e);
    }
  }
});
