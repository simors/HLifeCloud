/**
 * Created by wanpeng on 2017/7/14.
 */
var GLOBAL_CONFIG = require('../../config')
var OAuth = require('wechat-oauth');
var mpTokenFuncs = require('../Token')

var client = new OAuth(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret, mpTokenFuncs.getOauthTokenFromMysql, mpTokenFuncs.setOauthTokenToMysql);


function userAuthRequest(req, res) {
  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/wxOauth/callback'
  var url = client.getAuthorizeURL(auth_callback_url, '', 'snsapi_userinfo');
  res.redirect(url)
}

function getAccessToken(code) {
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

function getUserInfo(openid) {
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


var mpAuthFuncs = {
  userAuthRequest: userAuthRequest,
  getAccessToken: getAccessToken,
  getUserInfo: getUserInfo,
}

module.exports = mpAuthFuncs