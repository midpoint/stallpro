// miniprogram/utils/cloudApi.js
// 微信云开发数据库API封装

const db = () => getApp().getDb();

// ===== 用户相关 =====
const userApi = {
  // 创建或获取用户
  getOrCreateUser: async (openid, userInfo) => {
    const db = wx.cloud.database();
    const _ = db.command;

    // 先查询是否已存在
    const users = await db.collection('users').where({
      _openid: openid
    }).get();

    if (users.data.length > 0) {
      return users.data[0];
    }

    // 创建新用户
    const newUser = {
      openid,
      nickname: userInfo?.nickName || '新用户',
      avatar: userInfo?.avatarUrl || '',
      role: 'owner',
      stallId: null,
      createdAt: new Date()
    };

    const result = await db.collection('users').add({
      data: newUser
    });

    return { ...newUser, _id: result._id };
  },

  // 获取当前用户
  getCurrentUser: async () => {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._id) return null;

    const db = wx.cloud.database();
    const result = await db.collection('users').doc(userInfo._id).get();
    return result.data;
  },

  // 更新用户
  updateUser: async (userId, data) => {
    const db = wx.cloud.database();
    await db.collection('users').doc(userId).update({
      data
    });
  }
};

// ===== 摊位相关 =====
const stallApi = {
  // 获取摊位信息
  getStall: async (stallId) => {
    const db = wx.cloud.database();
    try {
      const result = await db.collection('stalls').doc(stallId).get();
      return result.data;
    } catch (e) {
      console.log('getStall error:', e);
      return null;
    }
  },

  // 根据openid获取用户的摊位
  getStallByOpenid: async (openid) => {
    const db = wx.cloud.database();
    const stalls = await db.collection('stalls').where({
      _openid: openid
    }).get();

    if (stalls.data.length > 0) {
      return stalls.data[0];
    }
    return null;
  },

  // 创建摊位
  createStall: async (ownerId, name, notice = '欢迎光临！') => {
    const db = wx.cloud.database();
    const stall = {
      ownerId,
      name: name || '新店铺',
      notice,
      settings: { orderPrefix: 'A' },
      status: 'active',
      createdAt: new Date()
    };

    const result = await db.collection('stalls').add({
      data: stall
    });

    // 创建默认商品
    await productApi.createDefaultProducts(result._id);

    return { ...stall, _id: result._id };
  },

  // 更新摊位
  updateStall: async (stallId, data) => {
    const db = wx.cloud.database();
    await db.collection('stalls').doc(stallId).update({
      data
    });
  }
};

// ===== 商品相关 =====
const productApi = {
  // 获取摊位商品
  getProducts: async (stallId) => {
    const db = wx.cloud.database();
    const products = await db.collection('products').where({
      stallId,
      status: 'active'
    }).get();
    return products.data;
  },

  // 创建默认商品
  createDefaultProducts: async (stallId) => {
    const db = wx.cloud.database();
    const defaultProducts = [
      { stallId, name: '鸡蛋灌饼', price: 8, category: '主食', status: 'active' },
      { stallId, name: '手抓饼', price: 10, category: '主食', status: 'active' },
      { stallId, name: '烤冷面', price: 8, category: '主食', status: 'active' },
      { stallId, name: '烤肠', price: 2, category: '小吃', status: 'active' }
    ];

    for (const p of defaultProducts) {
      await db.collection('products').add({ data: p });
    }
  },

  // 添加商品
  addProduct: async (product) => {
    const db = wx.cloud.database();
    const result = await db.collection('products').add({
      data: { ...product, createdAt: new Date() }
    });
    return result._id;
  },

  // 更新商品
  updateProduct: async (productId, data) => {
    const db = wx.cloud.database();
    await db.collection('products').doc(productId).update({ data });
  },

  // 删除商品
  deleteProduct: async (productId) => {
    const db = wx.cloud.database();
    await db.collection('products').doc(productId).remove();
  }
};

// ===== 订单相关 =====
const orderApi = {
  // 创建订单
  createOrder: async (stallId, items) => {
    const db = wx.cloud.database();
    const stall = await stallApi.getStall(stallId);
    const prefix = stall?.settings?.orderPrefix || 'A';

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 生成订单号
    const now = new Date();
    const orderNumber = `${prefix}${now.getMonth() + 1}${now.getDate()}${Math.floor(Math.random() * 100)}`;

    const order = {
      stallId,
      orderNumber,
      items,
      totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date()
    };

    const result = await db.collection('orders').add({ data: order });
    return { ...order, _id: result._id };
  },

  // 获取摊位订单
  getOrders: async (stallId) => {
    const db = wx.cloud.database();
    const orders = await db.collection('orders').where({
      stallId
    }).orderBy('createdAt', 'desc').get();
    return orders.data;
  },

  // 更新订单状态
  updateOrderStatus: async (orderId, status) => {
    const db = wx.cloud.database();
    await db.collection('orders').doc(orderId).update({
      data: { status }
    });
  },

  // 叫号
  callOrder: async (orderId) => {
    const db = wx.cloud.database();
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'completed',
        calledAt: new Date()
      }
    });
  },

  // 支付回调
  payNotify: async (orderId, transactionId) => {
    const db = wx.cloud.database();
    await db.collection('orders').doc(orderId).update({
      data: {
        paymentStatus: 'paid',
        transactionId,
        paidAt: new Date()
      }
    });
  }
};

// ===== 统计相关 =====
const statsApi = {
  // 今日统计
  getTodayStats: async (stallId) => {
    const db = wx.cloud.database();
    const _ = db.command;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await db.collection('orders').where({
      stallId,
      createdAt: _.gte(today)
    }).get();

    const orderCount = orders.data.length;
    const todayRevenue = orders.data
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingCount = orders.data.filter(o => o.status === 'pending').length;

    return { orderCount, todayRevenue, pendingCount };
  }
};

module.exports = {
  userApi,
  stallApi,
  productApi,
  orderApi,
  statsApi
};
