'use strict';
var AV = require('leanengine');
var wechat = require('wechat');
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var goodShare = require('./routes/goodShare');

var shopPromotionShare = require('./routes/shopPromotionShare')
var shopShare = require('./routes/shopShare')
var topicShare = require('./routes/topicShare')
var appDownload = require('./routes/appDownload')
var inviteCode = require('./routes/inviteCodeShare')
var download = require('./routes/download')
var wxOauth = require('./routes/wxOauth')
var wxProfile = require('./routes/wxProfile')
var wxWithdraw = require('./routes/wxWithdraw')
var wxSignIn = require('./routes/wxSignIn')
var wxError = require('./routes/wxError')
var mpServerFuncs = require('./mpFuncs/Server')
var GLOBAL_CONFIG = require('./config')
var test = require('./routes/test')

var app = express();

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));


// 设置默认超时时间
app.use(timeout('15s'));

// 加载云函数定义
require('./cloud');
// 加载云引擎中间件
app.use(AV.express());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function(req, res) {
  res.render('index', { currentTime: new Date() });
});


// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);

app.use('/shopPromotionShare', shopPromotionShare)

app.use('/shopShare', shopShare)

app.use('/goodShare', goodShare)

app.use('/topicShare', topicShare)

app.use('/appDownload', appDownload)

app.use('/inviteCodeShare', inviteCode)

app.use('/download', download)

app.use('/wxError', wxError)

app.use('/weixin', wechat(GLOBAL_CONFIG.wxConfig, mpServerFuncs.wechatServer))

app.use('/wxOauth', wxOauth)

app.use('/wxProfile', wxProfile)

app.use('/wxWithdraw', wxWithdraw)

app.use('/wxSignIn', wxSignIn)

app.use('/test', test)

app.get('/downloadLink', function (req, res) {
  res.render('downloadLink', {})
})

app.use(function(req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) { // jshint ignore:line
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if(statusCode === 500) {
    console.error(err.stack || err);
  }
  if(req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {}
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

module.exports = app;
