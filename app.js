'use strict';
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
var AV = require('leanengine');
var WechatAPI = require('wechat-api');
var wechat = require('wechat');
var fs = require('fs');
var request = require('request');


var GLOBAL_CONFIG = require('./config')

var app = express();

var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret);

var memu = {
  "button":[
    {
      "type":"click",
      "name":"我的二维码",
      "key":"MY_QRCODE"
    },
    {
      "type":"view",
      "name":"下载app",
      "url":"http://a.app.qq.com/o/simple.jsp?pkgname=com.hlife"
    },
    {
      'name': '个人中心',
      'sub_button': [
        {
          "type":"view",
          "name":"我的钱包",
          "url":"http://067c71ab.ngrok.io/wxOauth"
        },
        {
          "type":"view",
          "name":"汇邻优店",
          "url":"http://baidu.com"
        }
      ]
    }]
}


wechat_api.createMenu(memu, function (err, result) {
  if(result.errcode === 0) {
    console.log("微信公众号菜单创建成功")
  } else {
    console.log(err)
  }
})

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

app.use('/weixin', wechat(GLOBAL_CONFIG.wxConfig, function (req, res, next) {
  var message = req.weixin;
  console.log('weixin  message:', message)

  switch (message.MsgType) {
    case 'text':
      res.reply({
        type: 'text',
        content: '欢迎'
      })
      break;
    case 'event':

      if(message.Event === 'CLICK' && message.EventKey === 'MY_QRCODE') {
        var openid = message.FromUserName

        AV.Cloud.run('promoterGetPromoterQrCode', {openid: openid}).then((result) => {
          if(result.isSignIn && result.qrcode) {
            res.reply({
              type: 'image',
              content: {
                mediaId: result.qrcode.mediaId
              }
            })
          } else {
            res.reply([{
              title: '登录注册',
              description: '请登录注册',
              picurl: 'https://simors.github.io/ljyd_blog/ic_launcher.png',
              url: 'http://067c71ab.ngrok.io/wxOauth'
            }])
          }
        })

      } else if(message.Event === 'subscribe') {
        var scene_id = message.EventKey
        var openid = message.FromUserName
        var upUser_openid = scene_id.slice(8)

        var query = new AV.Query('_User')
        query.equalTo("openid", openid)

        query.first().then((result) => {
          if(!result) {
            var params = {
              openid: openid,
              upUserOpenid: upUser_openid
            }
            return AV.Cloud.run('utilBindWechatOpenid', params)
          }
          return new Promise((resolve) => {
            resolve()
          })
        }).then((result) => {
          //do nothing
        })

        res.reply({
          type: 'text',
          content: '欢迎光临'
        })

      }
      break
    default:
      break
  }
}))

app.use('/wxOauth', wxOauth)

app.use('/wxProfile', wxProfile)

app.use('/wxWithdraw', wxWithdraw)

app.use('/wxSignIn', wxSignIn)

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
