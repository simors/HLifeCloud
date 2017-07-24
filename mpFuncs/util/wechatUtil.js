/**
 * Created by yangyang on 2017/7/17.
 */
var WechatAPI = require('wechat-api')
var OAuth = require('wechat-oauth');
var GLOBAL_CONFIG = require('../../config')
var mpTokenFuncs = require('../Token')

var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret, mpTokenFuncs.getApiTokenFromRedis, mpTokenFuncs.setApiTokenToRedis)

var oauth_client = new OAuth(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret, mpTokenFuncs.getOauthTokenFromMysql, mpTokenFuncs.setOauthTokenToMysql);

module.exports = {
  wechat_api,
  oauth_client,
}