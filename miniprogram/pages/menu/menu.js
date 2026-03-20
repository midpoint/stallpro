// pages/menu/menu.js - 顾客点餐页
const app = getApp();

Page({
  data: {
    stall: { name: '加载中...', notice: '' },
    products: [],
    cart: [],
    cartCount: 0,
    cartTotal: 0,
    orderNumber: null,
    showCart: false,
    pendingOrder: null
  },

  onLoad(options) {
    // 从URL参数获取摊位ID（扫码进入）
    const stallId = options.stallId || options.scene || '';
    if (stallId) {
      app.globalData.stallId = stallId;
      this.loadData(stallId);
    } else {
      wx.showToast({ title: '无法访问', icon: 'none' });
    }
  },

  onShow() {
    const stallId = app.globalData.stallId;
    if (stallId) {
      this.loadData(stallId);
    }
  },

  async loadData(stallId) {
    const that = this;

    // 加载摊位信息
    try {
      const db = wx.cloud.database();
      const stallRes = await db.collection('stalls').doc(stallId).get();
      if (stallRes.data) {
        that.setData({ stall: stallRes.data });
        wx.setNavigationBarTitle({ title: stallRes.data.name || '点餐' });
      }
    } catch (e) {
      console.log('load stall error:', e);
    }

    // 加载商品列表
    try {
      const db = wx.cloud.database();
      const productsRes = await db.collection('products').where({
        stallId: stallId,
        status: 'active'
      }).get();

      that.setData({ products: productsRes.data || [] });
    } catch (e) {
      console.log('load products error:', e);
    }
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
  async checkout() {
    if (this.data.cart.length === 0) return;

    const stallId = app.globalData.stallId;
    const that = this;

    wx.showLoading({ title: '创建订单...' });

    try {
      const db = wx.cloud.database();
      const stall = this.data.stall;
      const prefix = stall?.settings?.orderPrefix || 'A';

      const totalAmount = that.data.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // 生成订单号
      const now = new Date();
      const orderNumber = `${prefix}${now.getMonth() + 1}${now.getDate()}${Math.floor(Math.random() * 100)}`;

      const result = await db.collection('orders').add({
        data: {
          stallId,
          orderNumber,
          items: that.data.cart,
          totalAmount,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: new Date()
        }
      });

      wx.hideLoading();

      const order = { _id: result._id, orderNumber, items: that.data.cart, totalAmount };
      that.setData({
        pendingOrder: order,
        showCart: false
      });

      // 模拟支付成功
      that.simulatePayment(order);

    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '创建订单失败', icon: 'none' });
      console.log('checkout error:', e);
    }
  },

  // 模拟支付（演示用）
  async simulatePayment(order) {
    const that = this;

    wx.showLoading({ title: '支付中...' });

    // 模拟支付延迟
    setTimeout(async () => {
      try {
        const db = wx.cloud.database();
        await db.collection('orders').doc(order._id).update({
          data: {
            paymentStatus: 'paid',
            transactionId: `mock_${Date.now()}`,
            paidAt: new Date()
          }
        });
      } catch (e) {
        console.log('pay notify error:', e);
      }

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
          wx.navigateTo({
            url: `/pages/order/detail?orderId=${order._id}&stallId=${app.globalData.stallId}`
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

  onPullDownRefresh() {
    const stallId = app.globalData.stallId;
    if (stallId) {
      this.loadData(stallId);
    }
    wx.stopPullDownRefresh();
  }
});
