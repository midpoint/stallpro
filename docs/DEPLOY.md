# Vercel 部署指南

## 方案一：Vercel Serverless（推荐）

Vercel 原生支持 Serverless Functions，将每个 API 转为独立函数。

### 1. 项目结构改造

```
server/
├── api/                    # Vercel Serverless Functions
│   ├── auth.js
│   ├── stall.js
│   ├── product.js
│   ├── order.js
│   └── stats.js
├── models/                 # 数据模型
├── middleware/
│   └── auth.js
├── config/
│   └── database.js        # MongoDB 连接
├── package.json
└── vercel.json
```

### 2. 部署步骤

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
cd server
vercel
```

---

## 方案二：Railway（更推荐用于 Node.js 后端）

Railway 更好支持长时间运行的 Node.js 服务。

### 部署步骤

1. 访问 https://railway.app
2. 用 GitHub 登录
3. New Project → Deploy from GitHub repo
4. 选择 `stallpro/server` 目录
5. 添加环境变量：
   - `MONGODB_URI` → MongoDB Atlas 连接串
   - `JWT_SECRET` → 随机字符串
   - `PORT` → 3000

---

## 方案三：Render.com（免费）

类似 Railway，支持 Node.js。

---

## 推荐：MongoDB Atlas（免费数据库）

1. 访问 https://www.mongodb.com/cloud/atlas
2. 注册账号 → Free Tier
3. 创建 Cluster
4. 设置用户名密码
5. 获取连接串：
   ```
   mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/stallpro?retryWrites=true&w=majority
   ```

---

## 完整部署流程（Railway + Atlas）

```bash
# 1. 准备 Railway 部署配置
cat > server/package.json << 'EOF'
{
  "name": "stallpro-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2"
  }
}
EOF

# 2. Railway 部署命令
npx railway init
npx railway up
```

---

## 微信公众号/小程序配置

部署完成后，需要配置：

1. **服务器域名** → 在微信公众平台添加你的 API 域名
2. **JS接口安全域名**
3. **订阅消息模板**
4. **微信支付商户号**

---

## 一键部署按钮

可以在 GitHub 添加 Deploy to Railway 按钮：

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-repo/stallpro&name=stallpro)
