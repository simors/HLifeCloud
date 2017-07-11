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

function wechatGetAccessToken(code) {
  return new Promise(function (resolve, reject) {
    client.getAccessToken(code, function (err, result) {
      if(err) {
        reject(new Error('获取微信授权access_token失败'))
      } else {
        resolve(result)
      }
    })
  })
}

function wechatGetUser(openid) {
  return new Promise(function (resolve, reject) {
    client.getUser(openid, function (err, result) {
      if(err) {
        reject(new Error('获取微信用户信息失败'))
      } else {
        resolve(result)
      }
    })
  })
}

router.get('/', function (req, res, next) {
  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/wxOauth/callback'
  var url = client.getAuthorizeURL(auth_callback_url, '', 'snsapi_userinfo');
  res.redirect(url)
})

router.get('/callback', function (req, res, next) {
  var code = req.query.code;
  var accessToken = undefined
  var openid = undefined
  var unionid = undefined
  var expires_in = undefined

  wechatGetAccessToken(code).then((result) => {
    accessToken = result.data.access_token;
    openid = result.data.openid
    unionid = result.data.unionid
    expires_in = result.data.expires_in

    return AV.Cloud.run('isWXUnionIdSignIn', {unionid: unionid})
  }).then((result) => {
    if(!result.isSignIn) {
      return wechatGetUser(openid)
    } else {
      console.log("微信用户已注册！")
      return Promise.resolve()
    }
  }).then((userInfo) => {
    if(userInfo) {
      var nickname = userInfo.nickname
      var headimgurl = userInfo.headimgurl
      var authData = {
        "openid": unionid,
        "access_token": accessToken,
        "expires_at": Date.parse(expires_in),
      }
      var platform = 'weixin'
      var leanUser = new AV.User()
      leanUser.set('type', 'normal')
      leanUser.set('nickname', nickname)
      leanUser.set('username', unionid)
      leanUser.set('avatar', headimgurl)
      leanUser.set('openid', openid)
      return AV.User.associateWithAuthData(leanUser, platform, authData).then((user) => {
        return AV.Cloud.run('promoterSyncPromoterInfo', {userId: user.id})
      })
    } else {
      return Promise.resolve()
    }
  }).then(() => {
    res.redirect('/wxProfile?unionid=' + unionid + '&openid=' + openid)
  }).catch((error) => {
    console.log(error)
  })


})

module.exports = router