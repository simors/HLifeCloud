/**
 * Created by wanpeng on 2017/6/14.
 */
'use strict';
var AV = require('leanengine');
var router = require('express').Router();
var mpAuthFuncs = require('../mpFuncs/Auth')
var authFunc = require('../cloudFuncs/Auth')

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var User = AV.Object.extend('_User');

router.get('/', mpAuthFuncs.userAuthRequest)

router.get('/callback', function (req, res, next) {
  var code = req.query.code;
  var accessToken = undefined
  var openid = undefined
  var unionid = undefined
  var expires_in = undefined

  mpAuthFuncs.getAccessToken(code).then((result) => {
    accessToken = result.data.access_token;
    openid = result.data.openid
    unionid = result.data.unionid
    expires_in = result.data.expires_in

    return AV.Cloud.run('isWXUnionIdSignIn', {unionid: unionid})
  }).then((result) => {
    if(!result.isSignIn) {
      mpAuthFuncs.getUserInfo(openid).then((userInfo) => {
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
        return AV.User.associateWithAuthData(leanUser, platform, authData)
      }).then(() => {
        return AV.Cloud.run('promoterSyncPromoterInfo', {userId: user.id})
      }).then(() => {
        res.redirect('/wxProfile?unionid=' + unionid + '&openid=' + openid)
      })
    } else {
      authFunc.setUserOpenid(openid, unionid).then(() => {
        res.redirect('/wxProfile?unionid=' + unionid + '&openid=' + openid)
      })
    }
  }).catch((error) => {
    console.log(error)
    res.redirect('/wxError')
  })


})

module.exports = router