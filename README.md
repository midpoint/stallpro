# 摆摊666

> 边做边卖、边接单、边收款、叫号不用喊

# 界面展示
<img width="20%" alt="0" src="https://github.com/user-attachments/assets/cb288337-5569-46ce-9ab6-b31691dca270" />
<img width="20%" alt="3" src="https://github.com/user-attachments/assets/a405bb20-88c4-477d-9d26-e54332a056b3" />
<img width="20%" alt="1" src="https://github.com/user-attachments/assets/09b87219-d82a-43c5-93d0-0881d37b9b24" />
<img width="20%" alt="2" src="https://github.com/user-attachments/assets/ae424c12-e435-4b8f-a958-cb311bc74bc8" />

## 项目概述

摆摊666是一款为线下小吃摊主设计的全流程效率工具，帮助摊主解决边制作边接单、收款、对账的痛点。

## 产品形态

| 端 | 技术栈 | 访问方式 |
|---|---|---|
| 摊主端 | 微信小程序 | 微信内搜索"摆摊666"或扫码进入 |
| 顾客端 | 微信小程序 | 扫描摊位二维码 |
| Web版 | React | http://localhost:3000 |
| H5版 | HTML + JS | 直接打开 `customer-app/index.html` |

## 功能特性

### 摊主端（微信小程序）
- 📋 实时订单列表，支持按状态筛选（待接单/制作中/已完成）
- 🔔 语音播报新订单
- 👆 一键接单、完成、叫号
- 📊 今日/本周/本月订单统计、营收分析
- 📈 数据分析报表（热销商品、高峰时段）
- 💰 微信/支付宝收款二维码合一
- 🔗 扫码点餐二维码生成

### 顾客端（微信小程序）
- 🏪 扫码即用，无需下载
- 🛒 购物车点餐
- 📱 微信支付/模拟支付
- 🔔 取餐进度通知
- 📋 订单状态实时查看

## 技术架构

- **小程序端**：微信小程序原生开发 + 云开发（云数据库、云函数、云存储）
- **Web版**：React + Webpack
- **后端**：Node.js + Express（可选，配合MongoDB使用）

## 快速开始

### 微信小程序开发

1. 下载微信开发者工具
2. 导入 `miniprogram` 目录
3. 配置云开发环境（如已配置，忽略）
4. 添加管理员微信作为体验成员
5. 预览或真机调试

### Web版开发

```bash
cd /home/mj/aicode/stallpro
npm start
```

访问 http://localhost:3000

## 项目结构

```
stallpro/
├── README.md              # 项目说明
├── DESIGN.md              # 产品设计文档
├── package.json           # 项目配置
├── src/                   # Web版 React 源代码
│   ├── index.js           # 入口文件
│   ├── App.js             # 主应用组件
│   └── data/
│       └── mockData.js    # 模拟数据
├── miniprogram/           # 微信小程序源码
│   ├── app.js             # 小程序入口
│   ├── app.json           # 小程序配置
│   ├── pages/             # 页面
│   │   ├── login/         # 登录页
│   │   ├── stall/         # 摊位管理首页
│   │   ├── menu/          # 顾客点餐页
│   │   ├── order/         # 订单相关
│   │   ├── products/      # 商品管理
│   │   ├── profile/        # 个人中心
│   │   ├── settings/      # 店铺设置
│   │   ├── stats/         # 数据分析
│   │   └── shop/          # 收款账户设置
│   ├── components/        # 组件
│   ├── cloudfunctions/    # 云函数
│   └── utils/            # 工具函数
├── customer-app/         # H5顾客端
│   └── index.html
└── server/               # 后端服务（可选）
```

## 核心页面说明

### 摊主端页面

| 页面 | 功能 |
|------|------|
| 摊位管理首页 | 订单列表、快捷操作、收款码 |
| 商品管理 | 商品增删改、上下架 |
| 个人中心 | 入口汇总、今日统计 |
| 数据分析 | 订单/营收统计、热销排行、高峰时段 |
| 收款账户 | 微信/支付宝收款码设置 |
| 店铺设置 | 店铺信息、公告、订单设置 |

### 顾客端页面

| 页面 | 功能 |
|------|------|
| 点餐页 | 商品浏览、购物车、下单 |
| 订单详情 | 取餐号、订单状态、进度 |

## 技术亮点

- 🎨 极简设计，大字体、大按钮，单手操作
- 📱 微信云开发，无需自建服务器
- 🔊 语音合成 (TTS) 实现订单播报
- 📊 数据分析，辅助经营决策
- 💰 收款二维码合一，支持微信/支付宝

## 数据库说明

使用微信云开发，数据存储在云数据库：

| 集合 | 说明 |
|------|------|
| users | 用户信息 |
| stalls | 摊位信息 |
| products | 商品信息 |
| orders | 订单信息 |

## License

MIT
