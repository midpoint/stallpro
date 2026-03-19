// pages/menu/menu.js - 顾客点餐页（无需登录）
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    stall: { name: '加载中...', notice: '' },
    products: [],
    cart: [],
    cartCount: 0,
    cartTotal: 0,
    orderNumber: null  // 取餐号
  },

  onLoad(options) {
    // 从URL参数获取摊位ID（扫码进入）
    const stallId = options.stallId || options.scene || 'stall1';
    app.globalData.stallId = stallId;
    this.loadData(stallId);
  },

  onShow() {
    const stallId = app.globalData.stallId || 'stall1';
    this.loadData(stallId);
  },

  loadData(stallId) {
    // 加载摊位信息
    wx.request({
      url: `${API_BASE}/stall/${stallId}`,
      success: (res) => {
        if (res.data.success) {
          this.setData({ stall: res.data.data });
          wx.setNavigationBarTitle({ title: res.data.data.name || '点餐' });
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

  // 减少数量
  reduceCart(e) {
    const { id } = e.currentTarget.dataset;
    let cart = [...this.data.cart];
    const index = cart.findIndex(item => item.id === id);

    if (index > -1) {
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      } else {
        cart.splice(index, 1);
      }
    }

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    this.setData({ cart, cartCount, cartTotal });
  },

  // 增加数量
  addCart(e) {
    const { id } = e.currentTarget.dataset;
    let cart = [...this.data.cart];
    const index = cart.findIndex(item => item.id === id);

    if (index > -1) {
      cart[index].quantity += 1;
    }

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    this.setData({ cart, cartCount, cartTotal });
  },

  checkout() {
    if (this.data.cart.length === 0) return;

    const stallId = app.globalData.stallId || 'stall1';
    const that = this;

    wx.showLoading({ title: '提交订单...' });

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
          const order = res.data.data;
          that.setData({
            cart: [],
            cartCount: 0,
            cartTotal: 0,
            orderNumber: order.orderNumber
          });
          wx.showModal({
            title: '下单成功！',
            content: `取餐号：${order.orderNumber}\n请等待叫号取餐`,
            showCancel: false,
            success: () => {
              // 跳转到订单页面查看状态
              wx.navigateTo({
                url: `/pages/order/detail?orderId=${order._id}&stallId=${stallId}`
              });
            }
          });
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
    const stallId = app.globalData.stallId || 'stall1';
    this.loadData(stallId);
    wx.stopPullDownRefresh();
  }
});
