// pages/menu/menu.js
const app = getApp();
const api = require('../../api/api.js');

Page({
  data: {
    stall: null,
    products: [],
    categories: [],
    currentCategory: 'all',
    cart: [],
    cartTotal: 0,
    cartCount: 0,
    showCart: false,
    loading: true
  },

  onLoad(options) {
    // 获取摊位ID
    const stallId = options.stallId || app.globalData.stallId;
    if (stallId) {
      app.globalData.stallId = stallId;
      this.loadStallInfo(stallId);
      this.loadProducts(stallId);
    } else {
      // 没有摊位ID，显示选择摊位或创建摊位
      wx.showModal({
        title: '提示',
        content: '请先选择摊位',
        showCancel: false
      });
    }
  },

  // 加载摊位信息
  loadStallInfo(stallId) {
    api.getStall(stallId).then(res => {
      if (res.success) {
        this.setData({ stall: res.data });
        wx.setNavigationBarTitle({
          title: res.data.name
        });
      }
    });
  },

  // 加载商品列表
  loadProducts(stallId) {
    api.getProducts(stallId).then(res => {
      if (res.success) {
        const products = res.data;
        // 按分类分组
        const categories = ['all', ...new Set(products.map(p => p.category))];

        this.setData({
          products,
          categories,
          loading: false
        });
      }
    });
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ currentCategory: category });
  },

  // 添加到购物车
  addToCart(e) {
    const product = e.currentTarget.dataset.product;
    const specs = e.currentTarget.dataset.specs || '';

    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      specs,
      quantity: 1
    };

    // 检查是否已存在
    const existingIndex = this.data.cart.findIndex(
      item => item.id === cartItem.id && item.specs === cartItem.specs
    );

    let cart = [...this.data.cart];
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push(cartItem);
    }

    this.updateCart(cart);
  },

  // 更新购物车
  updateCart(cart) {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    this.setData({
      cart,
      cartCount,
      cartTotal
    });
  },

  // 减少数量
  reduceCart(e) {
    const { id, specs } = e.currentTarget.dataset;
    let cart = [...this.data.cart];

    const index = cart.findIndex(item => item.id === id && item.specs === specs);
    if (index > -1) {
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      } else {
        cart.splice(index, 1);
      }
    }

    this.updateCart(cart);
  },

  // 增加数量
  addCart(e) {
    const { id, specs } = e.currentTarget.dataset;
    let cart = [...this.data.cart];

    const index = cart.findIndex(item => item.id === id && item.specs === specs);
    if (index > -1) {
      cart[index].quantity += 1;
    }

    this.updateCart(cart);
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

  // 去结算
  checkout() {
    if (this.data.cart.length === 0) return;

    // 跳转到确认页面
    wx.navigateTo({
      url: `/pages/order/confirm?data=${encodeURIComponent(JSON.stringify(this.data.cart))}`
    });
  },

  // 语音点餐
  voiceOrder() {
    // 使用微信插件或API
    wx.showToast({
      title: '语音功能开发中',
      icon: 'none'
    });
  }
});
