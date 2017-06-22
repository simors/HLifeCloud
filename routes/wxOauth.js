/**
 * Created by wanpeng on 2017/6/14.
 */
'use strict';
var AV = require('leanengine');
var router = require('express').Router();
var OAuth = require('wechat-oauth');
var GLOBAL_CONFIG = require('../config')
var client = new OAuth(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret);

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var User = AV.Object.extend('_User');

router.get('/', function (req, res, next) {
  var domain = "http://hlyd-dev.leanapp.cn"
  var auth_callback_url = domain + '/wxOauth/callback'
  var url = client.getAuthorizeURL(auth_callback_url, '', 'snsapi_userinfo');
  console.log(url)
  res.redirect(url)
})

router.get('/callback', function (req, res, next) {
  var code = req.query.code;
  client.getAccessToken(code, function (err, result) {
    console.log(result)
    var accessToken = result.data.access_token;
    var openid = result.data.openid
    var unionid = result.data.unionid
    var expires_in = result.data.expires_in

    var params = {
      accessToken: accessToken,
      openid: openid,
      unionid: unionid,
      expires_in: expires_in,
    }

    AV.Cloud.run('isWXUnionIdSignIn', {unionid: unionid}).then((result) => {
      if(result.isSignIn) {  //已经注册
        res.render('wxProfile', {
          accessToken: accessToken,
          unionid: unionid,
          expires_in: expires_in,
        })
      } else {  //待注册登录
        res.render('wxSignIn', {
          accessToken: accessToken,
          unionid: unionid,
          expires_in: expires_in,
          openid: openid,
        })
      }
    }).catch((error) => {

    })

    // var query = new AV.Query(User)
    //   query.equalTo('openid', openid)
    // query.find().then(function (result) {
    //   if(result && result.length == 0) {
    //     res.render('wxLogin', {
    //       openid: openid,
    //       accessToken: accessToken,
    //       unionid: unionid,
    //       expires_in: expires_in,
    //     })
    //
    //   } else if(result && result.length == 1) {
    //     res.redirect('/wxProfile?openid=' + openid)
    //
    //     res.render('wxProfile', {})
    //   } else {
    //     console.log("query User error:", result)
    //   }
    // }, function (error) {
    //   next(new Error('Failed to get userinfo ' + req.query.code));
    // })

  })
})

module.exports = router