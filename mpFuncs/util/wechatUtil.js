/**
 * Created by yangyang on 2017/7/17.
 */
var WechatAPI = require('wechat-api')
var OAuth = require('wechat-oauth');
var GLOBAL_CONFIG = require('../../config')

var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret)

var oauth_client = new OAuth(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret);

module.exports = {
  wechat_api,
  oauth_client,
}