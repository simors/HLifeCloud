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
  var domain = "http://067c71ab.ngrok.io"
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

    client.getUser(openid, function (err, result) {
      var wxUserInfo = result;
      var nickname = wxUserInfo.nickname
      var headimgurl = wxUserInfo.headimgurl

      AV.Cloud.run('isWXUnionIdSignIn', {unionid: unionid}).then((result) => {
        if(result.isSignIn) {  //已经注册
          res.redirect('/wxProfile?unionid' + unionid)
        } else {  //待注册登录
          res.render('wxSignIn', {
            accessToken: accessToken,
            unionid: unionid,
            expires_in: expires_in,
            openid: openid,
            nickname: nickname,
            headimgurl: headimgurl,
          })
        }
      }).catch((error) => {

      })
    })

  })
})

module.exports = router