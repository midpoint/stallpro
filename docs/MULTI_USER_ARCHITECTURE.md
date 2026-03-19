# 摆摊666 - 微信小程序多用户架构方案

## 一、系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        系统架构图                                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│   顾客小程序      │     │   摊主小程序      │
│  (微信小程序)     │     │  (微信小程序)     │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │  HTTPS + WebSocket     │
         └──────────┬─────────────┘
                    │
         ┌──────────▼──────────┐
         │     后端 API 服务    │
         │    (Node.js)        │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │     数据库         │
         │   (MongoDB)        │
         └─────────────────────┘
```

## 二、微信小程序端

### 2.1 顾客端功能
- 扫码进入摊位
- 语音/手动下单
- 微信支付
- 查看取餐号、排队进度
- 接收服务通知（取餐提醒）

### 2.2 摊主端功能
- 登录/注册（手机号/微信授权）
- 摊位管理（名称、公告、商品）
- 实时订单列表
- 语音播报（订阅消息）
- 一键接单、完成、叫号
- 每日营收统计
- 收款二维码生成

## 三、后端服务

### 3.1 技术栈
- **运行时**: Node.js + Express
- **数据库**: MongoDB
- **实时通信**: WebSocket (Socket.io)
- **微信对接**: 微信支付API、微信登录、订阅消息

### 3.2 核心API

| 模块 | API | 方法 | 说明 |
|------|-----|------|------|
| 认证 | /api/auth/login | POST | 微信登录 |
| 认证 | /api/auth/register | POST | 注册商户 |
| 摊位 | /api/stall/:id | GET | 获取摊位信息 |
| 摊位 | /api/stall/:id/products | GET/POST | 商品管理 |
| 订单 | /api/orders | GET/POST | 订单管理 |
| 订单 | /api/orders/:id/status | PUT | 更新订单状态 |
| 支付 | /api/payment/create | POST | 创建支付订单 |
| 支付 | /api/payment/notify | POST | 支付回调 |
| 统计 | /api/stats/:stallId | GET | 营收统计 |

### 3.3 WebSocket事件

```javascript
// 服务端
io.on('connection', (socket) => {
  // 商户加入自己的房间
  socket.join(`stall_${stallId}`);

  // 新订单通知
  socket.on('new_order', (order) => {
    io.to(`stall_${stallId}`).emit('order_received', order);
  });

  // 叫号通知
  socket.on('call_number', (data) => {
    io.to(`stall_${stallId}`).emit('number_called', data);
  });
});
```

## 四、数据库设计

### 4.1 用户表 (User)
```javascript
{
  _id: ObjectId,
  openid: String,          // 微信openid
  unionid: String,         // 微信unionid
  phone: String,           // 手机号
  role: String,            // 'owner' | 'customer'
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 摊位表 (Stall)
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId,       // 商户ID
  name: String,            // 店名
  logo: String,            // logo URL
  notice: String,         // 公告
  qrcode: String,         // 摊位二维码
  status: String,         // 'active' | 'inactive'
  settings: {
    orderPrefix: String,  // 取餐号前缀
    autoCall: Boolean,
    voiceEnabled: Boolean
  },
  createdAt: Date
}
```

### 4.3 商品表 (Product)
```javascript
{
  _id: ObjectId,
  stallId: ObjectId,
  name: String,
  price: Number,
  image: String,
  category: String,
  specs: [{
    name: String,
    options: [{ label: String, price: Number }]
  }],
  stock: Number,
  status: String,         // 'active' | 'inactive'
  sort: Number,
  createdAt: Date
}
```

### 4.4 订单表 (Order)
```javascript
{
  _id: ObjectId,
  stallId: ObjectId,
  orderNumber: String,    // 取餐号 A01
  customerId: ObjectId,
  items: [{
    productId: ObjectId,
    name: String,
    price: Number,
    specs: String,
    quantity: Number
  }],
  totalAmount: Number,
  status: String,        // 'pending' | 'cooking' | 'completed' | 'taken'
  paymentStatus: String,  // 'paid' | 'unpaid'
  paymentMethod: String,  // 'wechat' | 'alipay'
  transactionId: String,  // 支付流水号
  remarks: String,
  createdAt: Date,
  completedAt: Date,
  takenAt: Date
}
```

## 五、微信小程序关键配置

### 5.1 app.json
```json
{
  "pages": [
    "pages/index/index",
    "pages/menu/menu",
    "pages/order/order",
    "pages/stall-admin/stall-admin"
  ],
  "window": {
    "navigationBarTitleText": "摆摊666"
  },
  "tabBar": {
    "color": "#666",
    "selectedColor": "#FF6B35",
    "items": [
      { "pagePath": "pages/index/index", "name": "首页" },
      { "pagePath": "pages/order/order", "name": "订单" },
      { "pagePath": "pages/stall-admin/stall-admin", "name": "管理" }
    ]
  }
}
```

### 5.2 订阅消息（关键！）
```javascript
// 顾客端 - 订阅取餐通知
wx.requestSubscribeMessage({
  tmplIds: ['YOUR_TEMPLATE_ID'],
  success(res) {
    console.log('订阅成功');
  }
});

// 摊主端 - 订阅新订单通知
wx.requestSubscribeMessage({
  tmplIds: ['YOUR_ORDER_TEMPLATE_ID'],
});
```

### 5.3 微信支付
```javascript
// 创建支付订单
const payResult = await wx.requestPayment({
  timeStamp: paymentData.timeStamp,
  nonceStr: paymentData.nonceStr,
  package: paymentData.package,
  signType: 'MD5',
  paySign: paymentData.paySign
});
```

## 六、开发计划

### 第一阶段：基础功能（1-2周）
- [ ] 后端API搭建
- [ ] MongoDB数据库设计
- [ ] 摊主端小程序（登录、商品管理）
- [ ] 顾客端小程序（扫码、点单）

### 第二阶段：核心功能（1-2周）
- [ ] 微信支付对接
- [ ] 实时订单（WebSocket）
- [ ] 语音播报
- [ ] 订阅消息

### 第三阶段：完善功能（1周）
- [ ] 数据统计
- [ ] 商家中心
- [ ] 性能优化

## 七、关键难点

1. **微信支付商户入驻** - 需要营业执照
2. **订阅消息模板** - 需要在微信公众平台申请
3. **语音播报** - 需要使用微信同声传译插件或TTS
4. **多实例WebSocket** - 生产环境需要Redis适配器

## 八、部署

- **前端**: 微信小程序云开发 或 自建服务器
- **后端**: 云服务器（阿里云/腾讯云）+ Node.js
- **数据库**: MongoDB云数据库
- **HTTPS**: 需配置SSL证书
