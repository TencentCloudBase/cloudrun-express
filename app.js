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
