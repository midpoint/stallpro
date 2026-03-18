# 摆摊助手 - 一键部署

## 方式一：Vercel（适合 Serverless）

### 前置条件
- GitHub 账号
- Vercel 账号

### 部署步骤

```bash
# 1. 克隆项目
git clone <your-repo>
cd stallpro

# 2. 修改 server/api 目录结构适配 Vercel
# （已创建示例代码）

# 3. 推送到 GitHub

# 4. 访问 https://vercel.com
#    Import Git Repository → 选择 stallpro/server

# 5. 配置环境变量
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

---

## 方式二：Railway（推荐 ✅）

Railway 更适合 Node.js + WebSocket 应用。

### 部署步骤

```bash
# 1. 安装 Railway CLI
npm i -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
cd server
railway init

# 4. 添加 MongoDB
railway add mongodb

# 5. 部署
railway up
```

或直接在 GitHub 添加按钮：

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/project?template=https://github.com/yourusername/stallpro&name=stallpro)

---

## 方式三：Render.com（免费）

```bash
# 1. 访问 https://render.com
# 2. New Web Service
# 3. 连接到 GitHub 仓库
# 4. 设置：
#    - Build Command: npm install
#    - Start Command: node index.js
# 5. 添加环境变量
```

---

## 推荐：MongoDB Atlas 免费数据库

1. 访问 https://www.mongodb.com/cloud/atlas
2. 创建免费集群 (M0)
3. 创建用户，获取连接串
4. 格式：`mongodb+srv://user:password@cluster.xxx.mongodb.net/stallpro`

---

## 完整流程示例

```bash
# 1. 在 GitHub 创建仓库
git init
git add .
git commit -m "init"
git remote add origin https://github.com/yourname/stallpro.git
git push -u origin main

# 2. Railway 部署
npm i -g @railway/cli
railway login
railway init
railway add mongodb
railway up

# 3. 获取数据库连接串
# Railway 会自动生成 MONGODB_URI

# 4. 访问 API
# https://your-project.railway.app/api/health
```

---

## 微信小程序配置

部署完成后：

1. **服务器域名**：在微信公众平台 → 开发管理 → 开发设置 → 服务器域名
   ```
   https://your-app.railway.app
   ```

2. **业务域名**：同上

3. **小程序 app.js** 修改：
   ```javascript
   apiBase: 'https://your-app.railway.app/api'
   ```
