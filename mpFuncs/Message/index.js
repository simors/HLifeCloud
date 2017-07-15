/**
 * Created by wanpeng on 2017/7/14.
 */
var GLOBAL_CONFIG = require('../../config')
var OAuth = require('wechat-oauth');
var WechatAPI = require('wechat-api');

var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret);

function sendPaymentMessage(req, res) {

  var data = {
    "first": {
      "value":"恭喜你购买成功！",
      "color":"#173177"
    },
    "orderMoneySum": {
      "value":"100.00元",
      "color":"#173177"
    },
    "orderProductName" : {
      "value":"店铺注册",
      "color":"#173177"
    },
    "Remark":{
      "value":"如有问题请在汇邻优店公众号内留言，小汇将第一时间为您服务！",
      "color":"#173177"
    }
  }

  wechat_api.sendTemplate(openid, templateId, url, data, function (err, result) {

  })
}

var mpMsgFuncs = {
  sendPaymentMessage: sendPaymentMessage,
}

module.exports = mpMsgFuncs