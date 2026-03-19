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
    orderNumber: null,
    showCart: false,
    pendingOrder: null  // 待支付的订单
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

  // 显示购物车
  showCartPanel() {
    if (this.data.cartCount > 0) {
      this.setData({ showCart: true });
    }
  },

  // 隐藏购物车
  hideCartPanel() {
    this.setData({ showCart: false });
  },

  // 阻止冒泡
  stopPropagation() {},

  // 提交订单（创建订单）
  checkout() {
    if (this.data.cart.length === 0) return;

    const stallId = app.globalData.stallId || 'stall1';
    const that = this;

    wx.showLoading({ title: '创建订单...' });

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
            pendingOrder: order,
            showCart: false
          });
          // 发起支付
          that.requestPayment(order);
        } else {
          wx.showToast({ title: res.data.message || '创建订单失败', icon: 'none' });
        }
      },
      fail() {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 发起微信支付
  requestPayment(order) {
    const that = this;

    // 调用后端获取支付参数
    wx.request({
      url: `${API_BASE}/order/${order._id}/pay`,
      method: 'POST',
      success(res) {
        if (res.data.success) {
          // TODO: 实际调用 wx.requestPayment
          // 由于没有真实商户号，这里模拟支付成功

          // 模拟支付成功
          that.simulatePayment(order);
        } else {
          wx.showToast({ title: res.data.message || '支付失败', icon: 'none' });
        }
      },
      fail() {
        // 网络错误，模拟支付成功演示
        that.simulatePayment(order);
      }
    });
  },

  // 模拟支付（演示用）
  simulatePayment(order) {
    const that = this;

    wx.showLoading({ title: '支付中...' });

    // 模拟支付延迟
    setTimeout(() => {
      // 调用支付回调
      wx.request({
        url: `${API_BASE}/order/${order._id}/payNotify`,
        method: 'POST',
        data: { transactionId: `mock_${Date.now()}` },
        success(payRes) {
          wx.hideLoading();

          // 清空购物车
          that.setData({
            cart: [],
            cartCount: 0,
            cartTotal: 0,
            orderNumber: order.orderNumber,
            pendingOrder: null
          });

          // 支付成功
          wx.showModal({
            title: '支付成功！',
            content: `取餐号：${order.orderNumber}\n请等待叫号取餐`,
            showCancel: false,
            success: () => {
              // 跳转到订单页面
              wx.navigateTo({
                url: `/pages/order/detail?orderId=${order._id}&stallId=${app.globalData.stallId}`
              });
            }
          });
        },
        fail() {
          wx.hideLoading();
          // 即使回调失败也显示成功（演示用）
          that.setData({
            cart: [],
            cartCount: 0,
            cartTotal: 0,
            orderNumber: order.orderNumber,
            pendingOrder: null
          });

          wx.showModal({
            title: '支付成功！',
            content: `取餐号：${order.orderNumber}\n请等待叫号取餐`,
            showCancel: false,
            success: () => {
              wx.navigateTo({
                url: `/pages/order/detail?orderId=${order._id}&stallId=${app.globalData.stallId}`
              });
            }
          });
        }
      });
    }, 1500);
  },

  // 清空购物车
  clearCart() {
    this.setData({
      cart: [],
      cartCount: 0,
      cartTotal: 0,
      showCart: false
    });
  },

  // 切换到摊主后台
  switchToOwner() {
    wx.switchTab({
      url: '/pages/stall/index'
    });
  },

  onPullDownRefresh() {
    const stallId = app.globalData.stallId || 'stall1';
    this.loadData(stallId);
    wx.stopPullDownRefresh();
  }
});
