# 快速部署 Express 应用

## 📋 目录导航

- [部署方式对比](#部署方式对比)
- [前置条件](#前置条件)
- [第一步：创建 Express 应用](#第一步创建-express-应用)
- [第二步：添加 API 路由](#第二步添加-api-路由)
- [第三步：本地测试](#第三步本地测试)
- [第四步：准备部署文件](#第四步准备部署文件)
- [第五步：项目结构](#第五步项目结构)
- [第六步：部署应用](#第六步部署应用)
- [第七步：访问您的应用](#第七步访问您的应用)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)
- [进阶功能](#进阶功能)

---

本指南介绍如何在 CloudBase 上部署 Express 应用程序，支持两种部署方式：

- **HTTP 云函数**：适合轻量级应用和 API 服务，按请求计费，冷启动快
- **云托管**：适合持续运行的应用，支持更复杂的部署需求，容器化部署

## 部署方式对比

| 特性 | HTTP 云函数 | 云托管 |
|------|------------|--------|
| **计费方式** | 按请求次数和执行时间 | 按资源使用量（CPU/内存） |
| **启动方式** | 冷启动，按需启动 | 持续运行 |
| **适用场景** | API 服务、轻量级应用 | 复杂应用、需要持续运行的服务 |
| **部署文件** | 需要 `scf_bootstrap` 启动脚本 | 需要 `Dockerfile` 容器配置 |
| **端口要求** | 固定 9000 端口 | 可自定义端口 |
| **扩缩容** | 自动按请求扩缩 | 支持自动扩缩容配置 |

## 前置条件

在开始之前，请确保您已经：

- 安装了 [Node.js 18.x](https://nodejs.org/) 或更高版本
- 拥有腾讯云账号并开通了 CloudBase 服务
- 了解基本的 Node.js 和 Express 开发知识

## 第一步：创建 Express 应用

> 💡 **提示**：如果您已经有一个 Express 应用，可以跳过此步骤。

### 创建项目目录

```bash
mkdir express-cloudbase
cd express-cloudbase
```

### 使用 Express Generator 创建应用

```bash
# 使用 Express Generator 创建应用
npx express-generator --view=pug express-app

# 进入项目目录
cd express-app

# 安装依赖
npm install
```

这将创建一个使用 Pug 作为视图引擎的 Express 应用程序。

### 本地测试应用

启动开发服务器：

```bash
npm start
```

打开浏览器访问 `http://localhost:3000`，您应该能看到 Express 欢迎页面。

## 第二步：添加 API 路由

让我们创建一个 RESTful API 来演示 Express 的功能。

### 创建用户路由

在 `routes` 目录下创建 `users.js` 文件：

```javascript
const express = require('express');
const router = express.Router();

// 模拟用户数据
const users = [
  { id: 1, name: 'zhangsan', email: 'zhangsan@example.com' },
  { id: 2, name: 'lisi', email: 'lisi@example.com' },
  { id: 3, name: 'wangwu', email: 'wangwu@example.com' }
];

/* GET users listing */
router.get('/', function(req, res, next) {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  
  const paginatedUsers = users.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      total: users.length,
      page: parseInt(page),
      limit: parseInt(limit),
      items: paginatedUsers
    }
  });
});

/* GET user by ID */
router.get('/:id', function(req, res, next) {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

/* POST create user */
router.post('/', function(req, res, next) {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

module.exports = router;
```

### 创建健康检查路由

在 `routes` 目录下创建 `health.js` 文件：

```javascript
const express = require('express');
const router = express.Router();

/* GET health check */
router.get('/', function(req, res, next) {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    framework: 'Express',
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version
  });
});

module.exports = router;
```

### 更新应用配置

编辑 `app.js` 文件，添加新的路由和中间件：

```javascript
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var healthRouter = require('./routes/health');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 路由配置
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/health', healthRouter);

// 404 错误处理
app.use(function(req, res, next) {
  next(createError(404));
});

// 全局错误处理
app.use(function(err, req, res, next) {
  // 设置错误信息，只在开发环境提供详细错误
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 返回 JSON 格式的错误信息
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: req.app.get('env') === 'development' ? err.stack : undefined
    });
  } else {
    // 渲染错误页面
    res.status(err.status || 500);
    res.render('error');
  }
});

module.exports = app;
```

### 修改启动配置

编辑 `bin/www` 文件，确保应用监听正确的端口：

```javascript
#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('express-app:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '9000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, '0.0.0.0');
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log('Express server listening on ' + bind);
}
```

## 第三步：本地测试

启动应用：

```bash
npm start
```

测试 API 接口：

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试用户列表
curl http://localhost:3000/api/users

# 测试分页
curl "http://localhost:3000/api/users?page=1&limit=2"

# 测试获取单个用户
curl http://localhost:3000/api/users/1

# 测试创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"新用户","email":"newuser@example.com"}'
```

## 第四步：准备部署文件

根据您选择的部署方式，需要准备不同的配置文件：

### 📋 选择部署方式

<details>
<summary><strong>🔥 HTTP 云函数部署配置</strong></summary>

HTTP 云函数需要 `scf_bootstrap` 启动脚本和特定的端口配置。

#### 1. 修改端口配置

编辑 `bin/www` 文件，确保云函数环境使用 9000 端口：

```javascript
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
```

> ⚠️ **重要提示**：CloudBase HTTP 云函数要求应用监听 9000 端口。

#### 2. 创建启动脚本

创建 `scf_bootstrap` 文件（无扩展名）：

```bash
#!/bin/bash
export PORT=9000
npm start
```

为启动脚本添加执行权限：

```bash
chmod +x scf_bootstrap
```

#### 3. 项目结构

```
express-app/
├── bin/
│   └── www                 # 启动文件
├── public/                 # 静态资源
├── routes/                 # 路由文件
├── views/                  # 视图模板
├── app.js                  # 应用主文件
├── package.json           # 项目配置
├── package-lock.json      # 依赖锁定文件
└── scf_bootstrap         # 🔑 云函数启动脚本
```

> 💡 **说明**：
> - `scf_bootstrap` 是 CloudBase 云函数的启动脚本
> - 设置 `PORT=9000` 环境变量确保应用监听正确端口
> - 使用 `npm start` 启动应用

</details>

<details>
<summary><strong>🐳 云托管部署配置</strong></summary>

云托管使用 Docker 容器化部署，需要 `Dockerfile` 配置文件。

#### 1. 创建 Dockerfile

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
RUN npm install

# 将当前目录（dockerfile所在目录）下所有文件都拷贝到工作目录下（.dockerignore中文件除外）
COPY . /app

# 执行启动命令
CMD ["npm", "start"]
```

#### 2. 创建 .dockerignore 文件

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
```

#### 3. 项目结构

```
express-app/
├── bin/
│   └── www                 # 启动文件
├── public/                 # 静态资源
├── routes/                 # 路由文件
├── views/                  # 视图模板
├── app.js                  # 应用主文件
├── package.json           # 项目配置
├── package-lock.json      # 依赖锁定文件
├── Dockerfile            # 🔑 容器配置文件
└── .dockerignore         # Docker 忽略文件
```

> 💡 **说明**：
> - 云托管支持自定义端口，默认使用 3000 端口
> - Docker 容器提供了更好的环境隔离和依赖管理
> - 支持更复杂的部署配置和扩缩容策略

</details>

## 第五步：项目结构

确保您的项目目录结构包含必要的文件。根据部署方式的不同，某些文件是可选的：

```
express-app/
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
├── scf_bootstrap         # HTTP 云函数启动脚本 (仅云函数需要)
├── Dockerfile            # 云托管容器配置 (仅云托管需要)
└── .dockerignore         # Docker 忽略文件 (仅云托管需要)
```

## 第六步：部署应用

选择您需要的部署方式：

### 🚀 部署方式选择

<details>
<summary><strong>🔥 部署到 HTTP 云函数</strong></summary>

#### 通过控制台部署

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择您的环境，进入「云函数」页面
3. 点击「新建云函数」
4. 选择「HTTP 云函数」
5. 填写函数名称（如：`express-app`）
6. 选择运行时：**Node.js 18.x**（或其他支持的版本）
7. 提交方法选择：**本地上传文件夹**
8. 函数代码选择 `express-app` 目录进行上传
9. **自动安装依赖**：开启此选项
10. 点击「创建」按钮等待部署完成

#### 通过 CLI 部署(敬请期待)

#### 打包部署

如果需要手动打包：

```bash
# 创建部署包（排除云托管相关文件）
zip -r express-app.zip . -x "node_modules/*" ".git/*" "*.log" "Dockerfile" ".dockerignore"
```

</details>

<details>
<summary><strong>🐳 部署到云托管</strong></summary>

#### 通过控制台部署

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择您的环境，进入「云托管」页面
3. 点击「新建服务」
4. 填写服务名称（如：`express-service`）
5. 选择「本地代码」上传方式
6. 上传包含 `Dockerfile` 的项目目录
7. 配置服务参数：
   - **端口**：3000（或您在应用中配置的端口）
   - **CPU**：0.25 核
   - **内存**：0.5 GB
   - **实例数量**：1-10（根据需求调整）
8. 点击「创建」按钮等待部署完成

#### 通过 CLI 部署

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 部署云托管服务
tcb run deploy --port 3000
```
</details>

## 第七步：访问您的应用

### HTTP 云函数访问

部署成功后，您可以参考[通过 HTTP 访问云函数](https://docs.cloudbase.net/service/access-cloud-function)设置自定义域名访问 HTTP 云函数。

访问地址格式：`https://your-function-url/`

### 云托管访问

云托管部署成功后，系统会自动分配访问地址。您也可以绑定自定义域名。

访问地址格式：`https://your-service-url/`

### 测试接口

无论使用哪种部署方式，您都可以测试以下接口：

- **根路径**：`/` - Express 欢迎页面
- **健康检查**：`/health` - 查看应用状态
- **用户列表**：`/api/users` - 获取用户列表
- **用户详情**：`/api/users/1` - 获取特定用户
- **创建用户**：`POST /api/users` - 创建新用户

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

## 常见问题

### ❓ 问题分类

<details>
<summary><strong>🔥 HTTP 云函数相关问题</strong></summary>

#### Q: 为什么 HTTP 云函数必须使用 9000 端口？
A: CloudBase HTTP 云函数要求应用监听 9000 端口，这是平台的标准配置。

#### Q: HTTP 云函数如何处理冷启动？
A: 云函数在没有请求时会自动休眠，首次请求时需要冷启动。可以通过预热或保持活跃来减少冷启动时间。

#### Q: scf_bootstrap 文件有什么作用？
A: `scf_bootstrap` 是云函数的启动脚本，用于设置环境变量和启动应用程序。

#### Q: 如何优化云函数的性能？
A: 
- 减少依赖包大小
- 使用环境变量缓存配置
- 避免在函数中进行重复的初始化操作
- 合理设置内存配置

</details>

<details>
<summary><strong>🐳 云托管相关问题</strong></summary>

#### Q: 云托管支持哪些端口？
A: 云托管支持自定义端口，默认推荐使用 3000 端口，也可以根据需要配置其他端口。

#### Q: 如何配置云托管的自动扩缩容？
A: 在控制台的服务配置中，可以设置最小和最大实例数量，系统会根据负载自动调整。

#### Q: Dockerfile 中为什么使用 Alpine Linux？
A: Alpine Linux 是轻量级的 Linux 发行版，镜像体积小，安全性高，适合容器化部署。

#### Q: 如何优化 Docker 镜像大小？
A: 
- 使用多阶段构建
- 清理不必要的文件和缓存
- 使用 .dockerignore 排除无关文件
- 选择合适的基础镜像

</details>

<details>
<summary><strong>🔧 通用问题</strong></summary>

#### Q: 如何处理静态文件？
A: Express 的静态文件中间件会自动处理 `public` 目录下的静态资源。

#### Q: 如何查看应用日志？
A: 
- **HTTP 云函数**：在 CloudBase 控制台的云函数页面，点击函数名称进入详情页查看运行日志
- **云托管**：在云托管服务详情页面查看实例日志

#### Q: 支持哪些 Node.js 版本？
A: CloudBase 支持 Node.js 16.x、18.x、20.x 等版本，建议使用最新的 LTS 版本。

#### Q: 如何处理 CORS 跨域问题？
A: 可以使用 `cors` 中间件或手动设置响应头来处理跨域请求。

#### Q: 两种部署方式如何选择？
A: 
- **选择 HTTP 云函数**：轻量级 API 服务、间歇性访问、成本敏感
- **选择云托管**：复杂应用、持续运行、需要更多控制权

</details>

## 最佳实践

### 1. 环境变量管理

在 `app.js` 中添加环境变量支持：

```javascript
// 加载环境变量
require('dotenv').config();

// 使用环境变量
const isDevelopment = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 3000; // 云托管默认端口
```

### 2. 端口配置策略

为了同时支持两种部署方式，建议使用动态端口配置：

```javascript
// bin/www 文件中的端口配置
var port = normalizePort(process.env.PORT || (process.env.CLOUDBASE_FUNCTION ? '9000' : '3000'));
```

### 3. 添加 CORS 支持

安装并配置 CORS 中间件：

```bash
npm install cors
```

```javascript
const cors = require('cors');

// 配置 CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

### 4. 请求日志

使用 Morgan 中间件记录请求日志：

```javascript
const morgan = require('morgan');

// 配置日志格式
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
```

### 5. 错误处理

实现全局错误处理中间件：

```javascript
// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### 6. 安全配置

安装并配置 Helmet 中间件：

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');

// 安全头配置
app.use(helmet());
```

### 7. 健康检查优化

增强健康检查接口，支持不同部署环境：

```javascript
router.get('/', function(req, res, next) {
  const deploymentType = process.env.CLOUDBASE_FUNCTION ? 'HTTP云函数' : '云托管';
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    framework: 'Express',
    deployment: deploymentType,
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version,
    port: process.env.PORT || 'default'
  });
});
```

### 8. 部署前检查清单

<details>
<summary><strong>🔥 HTTP 云函数部署检查</strong></summary>

#### HTTP 云函数部署检查

- [ ] `scf_bootstrap` 文件存在且有执行权限
- [ ] 端口配置为 9000
- [ ] 依赖项在 `package.json` 中正确声明
- [ ] 排除不必要的文件（如 `Dockerfile`、`.dockerignore`）
- [ ] 测试本地启动是否正常
- [ ] 检查启动脚本语法是否正确

</details>

<details>
<summary><strong>🐳 云托管部署检查</strong></summary>

#### 云托管部署检查

- [ ] `Dockerfile` 文件存在且配置正确
- [ ] `.dockerignore` 文件配置合理
- [ ] 端口配置灵活（支持环境变量）
- [ ] 容器启动命令正确
- [ ] 排除不必要的文件（如 `scf_bootstrap`）
- [ ] 本地 Docker 构建测试通过

</details>

## 进阶功能

### 数据库集成

集成 MongoDB 或 MySQL：

```bash
npm install mongoose
# 或
npm install mysql2
```

### 身份验证

添加 JWT 身份验证：

```bash
npm install jsonwebtoken bcryptjs
```

### API 文档

使用 Swagger 生成 API 文档：

```bash
npm install swagger-jsdoc swagger-ui-express
```
