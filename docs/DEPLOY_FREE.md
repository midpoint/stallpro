# 摆摊助手 - 免费部署指南

## 本地测试 ✅

API 服务器已测试通过！当前可用的 API：

```
http://localhost:3003/api              # 根路径
http://localhost:3003/api/health      # 健康检查
http://localhost:3003/api/stall/1    # 摊位信息
http://localhost:3003/api/product/stall/1  # 商品列表
http://localhost:3003/api/order       # 创建订单
```

---

## 免费部署方案

### 方案1：Railway（推荐 - 有免费层）

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 创建项目（选择 Node.js 模板）
railway init

# 4. 添加数据库（可选）
railway add mongodb

# 5. 部署
cd server
railway up

# 6. 获取访问地址
railway open
```

### 方案2：Render.com（免费）

1. 访问 https://render.com，注册账号
2. New Web Service
3. 连接到 GitHub 仓库
4. 配置：
   - Build Command: `npm install`
   - Start Command: `node index.js`
5. 添加环境变量
6. Deploy

### 方案3：Vercel

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
cd server
vercel

# 按提示选择配置
```

---

## 快速部署到 Railway（最简单）

访问 https://railway.app，按以下步骤：

1. **Sign Up** → 用 GitHub 登录
2. **New Project** → 选择 "Empty Project"
3. **Add GitHub Repo** → 选择 stallpro 仓库
4. **Configure** → 设置 Root Directory 为 `server`
5. **Deploy** → 等待部署完成

---

## 部署后配置

获取部署地址后，修改小程序 `app.js`：

```javascript
apiBase: 'https://your-app.railway.app/api'
```

---

## 当前状态

| 项目 | 状态 |
|------|------|
| 后端API | ✅ 本地测试通过 |
| Vercel配置 | ✅ 已创建 |
| Railway配置 | ✅ 可直接部署 |
| MongoDB | 需连接 Atlas 或 Railway MongoDB |
