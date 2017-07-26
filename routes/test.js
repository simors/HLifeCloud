/**
 * Created by wanpeng on 2017/7/21.
 */

'use strict';
var router = require('express').Router();
var GLOBAL_CONFIG = require('../config')
var OAuth = require('wechat-oauth');
var mpAuthFuncs = require('../mpFuncs/Auth')
var mpTokenFuncs = require('../mpFuncs/Token')


var client = new OAuth(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret, mpTokenFuncs.getOauthTokenFromMysql, mpTokenFuncs.setOauthTokenToMysql);

var userId = undefined

router.get('/:id', function (req, res, next) {

  var testId = req.params.id
  userId = req.query.userId
  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/test/callback/' + testId
  var url = client.getAuthorizeURL(auth_callback_url, 'abc', 'snsapi_base');
  console.log("redirect url:", url)
  res.redirect(url)
});

router.get('/callback/:id', function (req, res, next) {
  var code = req.query.code

  // mpAuthFuncs.getAccessToken(code).then((result) => {
  //   var accessToken = result.data.access_token;
  //   var openid = result.data.openid
  //   var unionid = result.data.unionid
  //   var expires_in = result.data.expires_in
  //
  //   mpAuthFuncs.getUserInfo(openid).then((userInfo) => {
  //     console.log("userInfo", userInfo)
  //   })
  // })
  res.render('wxError', {
    errorMessage: "test 测试",
  })
})

module.exports = router;