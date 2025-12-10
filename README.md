# 快速部署 Express 应用

本篇文章为您介绍应用控制台的部署方案, 您可以通过以下操作完成部署。

## 模版部署 Express 应用

1、登录 [腾讯云托管控制台](https://tcb.cloud.tencent.com/dev#/platform-run/service/create?type=image)

2、点击通过模版部署，选择 ```Express 模版```

3、输入自定义服务名称，点击部署

4、等待部署完成之后，点击左上角箭头，返回到服务详情页

5、点击概述，获取默认域名并访问，会显示云托管默认首页

## 自定义部署 Express 应用

### 创建一个 Express 应用

创建一个新的 Express 应用，首先需要保证在你记得机器上安装 Node.js 8.2.0 及以上版本。

创建一个目录 ```cloudrun-express```, 然后 ```cd``` 进入该目录。

执行如下命令在 ```cloudrun-express``` 目录:

```
npx express-generator --view=pug
```

```cloudrun-express``` 将在目录中使用 pug 作为视图引擎创建一个新的 Express 应用程序。

### 在本地运行 Express 应用

运行 ```npm install``` 安装所有依赖项。

接下来，通过运行以下命令启动应用程序:

```
npm start
```

启动浏览器并导航至 http://localhost:3000 以查看该应用程序。

### 部署到云托管

1、在cloudrun-express目录下创建一个名称为Dockerfile的新文件,内容如下:

```
FROM alpine:3.13

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tencent.com/g' /etc/apk/repositories \
&& apk add --update --no-cache nodejs npm

# 容器默认时区为UTC，如需使用上海时间请启用以下时区设置命令
RUN apk add tzdata && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo Asia/Shanghai > /etc/timezone

# 使用 HTTPS 协议访问容器云调用证书安装
RUN apk add ca-certificates

# # 指定工作目录
WORKDIR /app

# 拷贝包管理文件
COPY package*.json /app/

# npm 源，选用国内镜像源以提高下载速度
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/
# RUN npm config set registry https://registry.npm.taobao.org/

# npm 安装依赖
RUN npm install

# 将当前目录（dockerfile所在目录）下所有文件都拷贝到工作目录下（.dockerignore中文件除外）
COPY . /app

# 执行启动命令
# 写多行独立的CMD命令是错误写法！只有最后一行CMD命令会被执行，之前的都会被忽略，导致业务报错。
# 请参考[Docker官方文档之CMD命令](https://docs.docker.com/engine/reference/builder/#cmd)
CMD ["npm", "start"]
```

2、进入 [腾讯云托管](https://tcb.cloud.tencent.com/dev#/platform-run/service/create?type=package),

3、选择 ```通过本地代码``` 部署，

4、填写配置信息:

  * 代码包类型: 选择文件夹
  * 代码包: 点击选择 cloudrun-express 目录，并上传目录文件
  * 服务名称: 填写服务名称
  * 部署类型: 选择容器服务型
  * 端口: 默认填写 3000
  * 目标目录: 默认为空
  * Dockerfile 名称: Dockerfile
  * 环境变量: 如果有按需要填写
  * 公网访问: 默认打开
  * 内网访问: 默认关闭

5、配置填写完成之后，点击部署等待部署完成，

6、部署完成之后，跳转到服务概述页面，点击默认域名进行公网访问及测试。
