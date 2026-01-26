# 快速部署 Express 应用

一个完整的 Express 应用模板，支持快速部署到 CloudBase 平台。

## 🚀 快速开始

### 前置条件

- [Node.js 18.x](https://nodejs.org/) 或更高版本
- 腾讯云账号并开通了 CloudBase 服务
- 基本的 Node.js 和 Express 开发知识

### 创建应用

```bash
# 创建项目目录
mkdir cloudrun-express && cd cloudrun-express

# 使用 Express Generator 创建应用
npx express-generator --view=pug .
# 或者创建子目录
# npx express-generator --view=pug cloudrun-express
# cd cloudrun-express

# 安装依赖
npm install
```

### 本地测试

```bash
# 启动开发服务器
npm start

# 访问应用
open http://localhost:3000
```

## 📦 项目结构

```
cloudrun-express/
├── bin/
│   └── www                 # 启动文件
├── public/                 # 静态资源
├── routes/                 # 路由文件
│   ├── index.js
│   ├── users.js
│   └── health.js
├── views/                  # 视图模板
├── app.js                  # 应用主文件
├── package.json           # 项目配置
├── .gitignore              # Git 忽略文件
├── scf_bootstrap          # HTTP 云函数启动脚本
├── Dockerfile             # 云托管容器配置
└── .dockerignore          # Docker 忽略文件
```

## 🎯 部署方式

### 部署方式对比

| 特性 | HTTP 云函数 | 云托管 |
|------|------------|--------|
| **计费方式** | 按请求次数和执行时间 | 按资源使用量（CPU/内存） |
| **启动方式** | 冷启动，按需启动 | 持续运行 |
| **适用场景** | API 服务、轻量级应用 | 复杂应用、需要持续运行的服务 |
| **端口要求** | 固定 9000 端口 | 可自定义端口（推荐 8080） |
| **扩缩容** | 自动按请求扩缩 | 支持自动扩缩容配置 |

### 选择部署方式

- **选择 HTTP 云函数**：轻量级 API 服务、间歇性访问、成本敏感
- **选择云托管**：复杂应用、持续运行、需要更多控制权

## 📚 详细部署指南

### 🔥 HTTP 云函数部署

适合轻量级应用和 API 服务，按请求计费，冷启动快。

**快速部署步骤：**
1. 确保端口配置为 9000
2. 创建 `scf_bootstrap` 启动脚本
3. 通过 CloudBase 控制台上传部署

[📖 查看详细的 HTTP 云函数部署指南](./docs/http-function.md)

### 🐳 云托管部署

适合持续运行的应用，支持更复杂的部署需求，容器化部署。

**快速部署步骤：**
1. 创建 `Dockerfile` 容器配置
2. 配置 `.dockerignore` 文件
3. 通过 CloudBase 控制台或 CLI 部署

[📖 查看详细的云托管部署指南](./docs/cloud-run.md)

## 🔧 API 接口

本模板包含以下 RESTful API 接口：

### 健康检查
```bash
GET /health
```

### 用户管理
```bash
GET /api/users          # 获取用户列表（支持分页）
GET /api/users/:id      # 获取单个用户
POST /api/users         # 创建用户
```

### 示例请求

```bash
# 健康检查
curl https://your-app-url/health

# 获取用户列表
curl https://your-app-url/api/users

# 创建新用户
curl -X POST https://your-app-url/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com"}'
```

## ❓ 常见问题

### 端口配置
- **HTTP 云函数**：必须使用 9000 端口
- **云托管**：推荐使用 8080 端口，支持自定义

### 文件要求
- **HTTP 云函数**：需要 `scf_bootstrap` 启动脚本
- **云托管**：需要 `Dockerfile` 和 `.dockerignore`

### 如何选择部署方式？
- **轻量级应用**：选择 HTTP 云函数
- **复杂应用**：选择云托管
- **成本敏感**：选择 HTTP 云函数
- **需要持续运行**：选择云托管

## 🛠️ 开发工具

### 推荐的开发依赖

```bash
# 开发工具
npm install --save-dev nodemon

# 安全和性能
npm install helmet compression cors

# 日志管理
npm install winston morgan
```

### 环境变量配置

创建 `.env` 文件：

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

## 📖 进阶功能

- **数据库集成**：支持 MongoDB、MySQL 等
- **身份验证**：JWT 认证实现
- **API 文档**：Swagger 文档生成
- **缓存策略**：Redis 缓存集成
- **监控告警**：性能监控和日志分析

## 🔗 相关链接

- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [Express 官方文档](https://expressjs.com/)
- [Node.js 官方文档](https://nodejs.org/docs/)

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](./LICENSE) 文件。

---

**需要帮助？** 

- 查看 [HTTP 云函数部署指南](./docs/http-function.md)
- 查看 [云托管部署指南](./docs/cloud-run.md)
- 访问 [CloudBase 官方文档](https://docs.cloudbase.net/)