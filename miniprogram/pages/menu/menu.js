// pages/menu/menu.js
const app = getApp();

Page({
  data: {
    stall: { name: '加载中...', notice: '' },
    products: [],
    cart: [],
    cartCount: 0,
    cartTotal: 0
  },

  onLoad(options) {
    const stallId = options.stallId || '1';
    this.loadData(stallId);
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadData('1');
  },

  loadData(stallId) {
    const baseUrl = 'https://stallpro.vercel.app/api';

    // 加载摊位信息
    wx.request({
      url: `${baseUrl}/stall/${stallId}`,
      success: (res) => {
        if (res.data.success) {
          this.setData({ stall: res.data.data });
        }
      }
    });

    // 加载商品列表
    wx.request({
      url: `${baseUrl}/product/stall/${stallId}`,
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

    const baseUrl = 'https://stallpro.vercel.app/api';
    const that = this;

    wx.request({
      url: `${baseUrl}/order`,
      method: 'POST',
      data: {
        stallId: '1',
        items: this.data.cart
      },
      success(res) {
        if (res.data.success) {
          wx.showToast({ title: '下单成功!', icon: 'success' });
          that.setData({ cart: [], cartCount: 0, cartTotal: 0 });
        } else {
          wx.showToast({ title: res.data.message || '下单失败', icon: 'none' });
        }
      },
      fail() {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  onPullDownRefresh() {
    this.loadData('1');
    wx.stopPullDownRefresh();
  }
});
