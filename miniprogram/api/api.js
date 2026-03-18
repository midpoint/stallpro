// api/api.js
const app = getApp();

const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBase}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      },
      fail: reject
    });
  });
};

module.exports = {
  // 认证
  login: (code, userInfo) => request({
    url: '/auth/wechat_login',
    method: 'POST',
    data: { code, userInfo }
  }),

  // 摊位
  getStall: (stallId) => request({
    url: `/stall/${stallId}`
  }),

  getMyStalls: () => request({
    url: '/stall/owner/my'
  }),

  createStall: (data) => request({
    url: '/stall',
    method: 'POST',
    data
  }),

  updateStall: (stallId, data) => request({
    url: `/stall/${stallId}`,
    method: 'PUT',
    data
  }),

  // 商品
  getProducts: (stallId) => request({
    url: `/product/stall/${stallId}`
  }),

  createProduct: (data) => request({
    url: '/product',
    method: 'POST',
    data
  }),

  updateProduct: (productId, data) => request({
    url: `/product/${productId}`,
    method: 'PUT',
    data
  }),

  deleteProduct: (productId) => request({
    url: `/product/${productId}`,
    method: 'DELETE'
  }),

  // 订单
  createOrder: (data) => request({
    url: '/order',
    method: 'POST',
    data
  }),

  getStallOrders: (stallId, status) => request({
    url: `/order/stall/${stallId}`,
    data: { status }
  }),

  getOrderDetail: (orderId) => request({
    url: `/order/${orderId}`
  }),

  updateOrderStatus: (orderId, status) => request({
    url: `/order/${orderId}/status`,
    method: 'PUT',
    data: { status }
  }),

  callOrder: (orderId) => request({
    url: `/order/${orderId}/call`,
    method: 'POST'
  }),

  // 统计
  getTodayStats: (stallId) => request({
    url: `/stats/today/${stallId}`
  }),

  getTrend: (stallId, days) => request({
    url: `/stats/trend/${stallId}`,
    data: { days }
  }),

  getTopProducts: (stallId) => request({
    url: `/stats/top-products/${stallId}`
  })
};
