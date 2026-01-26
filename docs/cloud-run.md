# Express 云托管部署指南

本指南详细介绍如何将 Express 应用部署到 CloudBase 云托管服务。

## 📋 目录导航

- [部署特性](#部署特性)
- [准备部署文件](#准备部署文件)
- [项目结构](#项目结构)
- [部署步骤](#部署步骤)
- [访问应用](#访问应用)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)
- [高级配置](#高级配置)

---

## 部署特性

云托管适合以下场景：

- **复杂应用**：需要持续运行的服务
- **高并发**：需要处理大量并发请求
- **自定义环境**：需要特定的运行时环境
- **微服务架构**：容器化部署和管理

### 技术特点

| 特性 | 说明 |
|------|------|
| **计费方式** | 按资源使用量（CPU/内存） |
| **启动方式** | 持续运行 |
| **端口配置** | 可自定义端口 |
| **扩缩容** | 支持自动扩缩容配置 |
| **容器化** | 基于 Docker 容器 |

## 准备部署文件

### 1. 创建 Dockerfile

创建 `Dockerfile` 文件：

```dockerfile
# 二开推荐阅读[如何提高项目构建效率](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/scene/build/speed.html)
FROM alpine:3.13

# 安装依赖包，如需其他依赖包，请到alpine依赖包管理(https://pkgs.alpinelinux.org/packages?name=php8*imagick*&branch=v3.13)查找。
# 选用国内镜像源以提高下载速度
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tencent.com/g' /etc/apk/repositories \
&& apk add --update --no-cache nodejs npm

# 容器默认时区为UTC，如需使用上海时间请启用以下时区设置命令
RUN apk add tzdata && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo Asia/Shanghai > /etc/timezone

# 使用 HTTPS 协议访问容器云调用证书安装
RUN apk add ca-certificates

# 指定工作目录
WORKDIR /app

# 拷贝包管理文件
COPY package*.json /app/

# npm 源，选用国内镜像源以提高下载速度
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/

# npm 安装依赖
RUN npm install --production

# 将当前目录（dockerfile所在目录）下所有文件都拷贝到工作目录下（.dockerignore中文件除外）
COPY . /app

# 暴露端口
EXPOSE 8080

# 执行启动命令
CMD ["npm", "start"]
```

### 2. 创建 .dockerignore 文件

创建 `.dockerignore` 文件以优化构建性能：

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.DS_Store
scf_bootstrap
*.log
docs/
.vscode/
.idea/
```

### 3. 修改端口配置

编辑 `bin/www` 文件，支持动态端口配置：

```javascript
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, '0.0.0.0');
```

### 4. 优化 package.json

确保 `package.json` 包含正确的配置：

```json
{
  "name": "cloudrun-express",
  "version": "1.0.0",
  "scripts": {
    "start": "node ./bin/www",
    "dev": "nodemon ./bin/www"
  },
  "dependencies": {
    "express": "^4.18.0",
    "morgan": "^1.10.0",
    "cookie-parser": "^1.4.6",
    "debug": "^4.3.4",
    "http-errors": "^2.0.0",
    "pug": "^3.0.2",
    "compression": "^1.7.4",
    "helmet": "^7.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 项目结构

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
├── package-lock.json      # 依赖锁定文件
├── Dockerfile            # 🔑 容器配置文件
└── .dockerignore         # Docker 忽略文件
```

> 💡 **说明**：
> - 云托管支持自定义端口，默认使用 8080 端口
> - Docker 容器提供了更好的环境隔离和依赖管理
> - 支持更复杂的部署配置和扩缩容策略

## 部署步骤

### 通过控制台部署

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择您的环境，进入「云托管」页面
3. 点击「新建服务」
4. 填写服务名称（如：`cloudrun-express-service`）
5. 选择「本地代码」上传方式
6. 上传包含 `Dockerfile` 的项目目录
7. 配置服务参数：
   - **端口**：8080（或您在应用中配置的端口）
   - **CPU**：0.25 核
   - **内存**：0.5 GB
   - **实例数量**：1-10（根据需求调整）
8. 点击「创建」按钮等待部署完成

### 通过 CLI 部署

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 初始化云托管配置
tcb run init

# 部署云托管服务
tcb run deploy --port 8080
```

### 配置文件部署

创建 `cloudbaserc.json` 配置文件：

```json
{
  "envId": "your-env-id",
  "framework": {
    "name": "express",
    "plugins": {
      "run": {
        "name": "@cloudbase/framework-plugin-run",
        "options": {
          "serviceName": "cloudrun-express-service",
          "servicePath": "/",
          "localPath": "./",
          "dockerfile": "./Dockerfile",
          "buildDir": "./",
          "cpu": 0.25,
          "mem": 0.5,
          "minNum": 1,
          "maxNum": 10,
          "policyType": "cpu",
          "policyThreshold": 60,
          "containerPort": 8080,
          "envVariables": {
            "NODE_ENV": "production"
          }
        }
      }
    }
  }
}
```

然后执行部署：

```bash
tcb framework deploy
```

## 访问应用

### 获取访问地址

云托管部署成功后，系统会自动分配访问地址。您也可以绑定自定义域名。

访问地址格式：`https://your-service-url/`

### 测试接口

- **根路径**：`/` - Express 欢迎页面
- **健康检查**：`/health` - 查看应用状态
- **用户列表**：`/api/users` - 获取用户列表
- **用户详情**：`/api/users/1` - 获取特定用户
- **创建用户**：`POST /api/users` - 创建新用户

### 示例请求

```bash
# 健康检查
curl https://your-service-url/health

# 获取用户列表
curl https://your-service-url/api/users

# 创建新用户
curl -X POST https://your-service-url/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com"}'
```

## 常见问题

### Q: 云托管支持哪些端口？
A: 云托管支持自定义端口，默认推荐使用 8080 端口，也可以根据需要配置其他端口。

### Q: 如何配置云托管的自动扩缩容？
A: 在控制台的服务配置中，可以设置：
- 最小实例数量
- 最大实例数量
- 扩缩容策略（CPU 使用率、内存使用率）
- 扩缩容阈值

### Q: Dockerfile 中为什么使用 Alpine Linux？
A: Alpine Linux 是轻量级的 Linux 发行版，具有以下优势：
- 镜像体积小（约 5MB）
- 安全性高
- 启动速度快
- 适合容器化部署

### Q: 如何查看云托管日志？
A: 在云托管服务详情页面可以查看：
- 实例日志
- 构建日志
- 访问日志
- 错误日志

### Q: 云托管如何处理静态文件？
A: Express 的静态文件中间件会自动处理 `public` 目录下的静态资源。云托管环境完全支持静态文件服务。

### Q: 如何配置环境变量？
A: 可以通过以下方式配置：
- 控制台服务配置页面
- `cloudbaserc.json` 配置文件
- Dockerfile 中的 ENV 指令

### Q: 云托管支持哪些数据库？
A: 云托管支持连接：
- CloudBase 数据库
- 云数据库 MySQL
- 云数据库 PostgreSQL
- Redis
- MongoDB

## 最佳实践

### 1. 多阶段构建优化

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 运行阶段
FROM alpine:3.13

RUN apk add --no-cache nodejs npm

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 8080
CMD ["npm", "start"]
```

### 2. 环境变量管理

```javascript
// config/index.js
module.exports = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
};
```

### 3. 健康检查增强

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();

router.get('/', async function(req, res, next) {
  try {
    // 检查数据库连接
    // const dbStatus = await checkDatabase();
    
    // 检查 Redis 连接
    // const redisStatus = await checkRedis();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      framework: 'Express',
      deployment: '云托管',
      version: process.env.npm_package_version || '1.0.0',
      node_version: process.version,
      memory_usage: process.memoryUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      // database: dbStatus,
      // redis: redisStatus
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
```

### 4. 日志配置

```javascript
// 使用 winston 进行日志管理
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

module.exports = logger;
```

### 5. 安全配置

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 安全头配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 15 分钟内最多 100 个请求
  message: {
    error: 'Too many requests, please try again later.'
  }
});

app.use('/api/', limiter);
```

### 6. 部署前检查清单

- [ ] `Dockerfile` 文件存在且配置正确
- [ ] `.dockerignore` 文件配置合理
- [ ] 端口配置灵活（支持环境变量）
- [ ] 容器启动命令正确
- [ ] 排除不必要的文件（如 `scf_bootstrap`）
- [ ] 本地 Docker 构建测试通过
- [ ] 环境变量配置完整
- [ ] 健康检查接口正常
- [ ] 日志输出格式正确
- [ ] 安全配置已启用

## 高级配置

### 1. 负载均衡配置

```json
{
  "run": {
    "name": "@cloudbase/framework-plugin-run",
    "options": {
      "serviceName": "cloudrun-express-service",
      "cpu": 1,
      "mem": 2,
      "minNum": 2,
      "maxNum": 20,
      "policyType": "cpu",
      "policyThreshold": 70,
      "containerPort": 8080,
      "customLogs": "stdout",
      "initialDelaySeconds": 2,
      "dataBaseName": "express-db"
    }
  }
}
```

### 2. 数据库连接池

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

module.exports = pool;
```

### 3. Redis 缓存

```javascript
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

module.exports = client;
```

### 4. 监控和告警

```javascript
// 添加性能监控中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
});
```

---

## 相关文档

- [返回主文档](../README.md)
- [HTTP 云函数部署指南](./http-function.md)
- [CloudBase 官方文档](https://docs.cloudbase.net/)