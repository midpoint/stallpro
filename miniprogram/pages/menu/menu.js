// pages/menu/menu.js
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    stall: { name: '加载中...', notice: '' },
    products: [],
    cart: [],
    cartCount: 0,
    cartTotal: 0,
    isLoggedIn: false
  },

  onLoad(options) {
    // 检查登录状态
    this.checkLogin();

    // 从分享链接获取摊位ID
    if (options.stallId) {
      app.globalData.stallId = options.stallId;
    }
  },

  onShow() {
    // 每次显示时检查登录并刷新数据
    if (app.isLoggedIn()) {
      this.loadData();
    }
  },

  checkLogin() {
    if (!app.isLoggedIn()) {
      // 未登录，跳转到登录页
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({ isLoggedIn: true });
    this.loadData();
  },

  loadData() {
    const stallId = app.globalData.stallId || 'stall1';

    // 加载摊位信息
    wx.request({
      url: `${API_BASE}/stall/${stallId}`,
      success: (res) => {
        if (res.data.success) {
          this.setData({ stall: res.data.data });
        }
      }
    });

    // 加载商品列表
    wx.request({
      url: `${API_BASE}/product/stall/${stallId}`,
      success: (res) => {
        if (res.data.success) {
          this.setData({ products: res.data.data });
        }
      }
    });
  },

  addToCart(e) {
    const product = e.currentTarget.dataset.product;

    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: 1
    };

    let cart = [...this.data.cart];
    const index = cart.findIndex(item => item.id === cartItem.id);

    if (index > -1) {
      cart[index].quantity += 1;
    } else {
      cart.push(cartItem);
    }

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    this.setData({ cart, cartCount, cartTotal });

    wx.showToast({ title: '已加入', icon: 'success' });
  },

  checkout() {
    if (this.data.cart.length === 0) return;

    const stallId = app.globalData.stallId || 'stall1';
    const that = this;

    wx.showLoading({ title: '提交中...' });

    wx.request({
      url: `${API_BASE}/order`,
      method: 'POST',
      data: {
        stallId: stallId,
        items: this.data.cart
      },
      success(res) {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ title: '下单成功!', icon: 'success' });
          that.setData({ cart: [], cartCount: 0, cartTotal: 0 });
        } else {
          wx.showToast({ title: res.data.message || '下单失败', icon: 'none' });
        }
      },
      fail() {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});
