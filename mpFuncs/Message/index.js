/**
 * Created by wanpeng on 2017/7/14.
 */
var GLOBAL_CONFIG = require('../../config')
var WechatAPI = require('wechat-api');
var mpTokenFuncs = require('../Token')

var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret, mpTokenFuncs.getApiTokenFromRedis, mpTokenFuncs.setApiTokenToRedis);

/**
 * 发送打赏模板消息
 * @param {String} openid 用户的openid
 * @param {Number} amount 打赏金额
 * @param {String} title 文章标题
 * @param {Date} created 打赏时间
 */
function sendRewardTmpMsg(openid, amount, title, created) {
  var templateId = GLOBAL_CONFIG.REWARD_TMP_ID
  var rewardArticle = '《' + title + '》'
  var rewardAmount = '¥' + amount.toFixed(2) +'元'
  var rewardTime = created.toLocaleString()
  var url = ""

  var data = {
    "first": {
      "value":"恭喜您收到新的打赏！\n",
      "color":"#173177"
    },
    "keyword1": {
      "value": rewardArticle,
      "color":"#173177"
    },
    "keyword2" : {
      "value": rewardAmount,
      "color":"#173177"
    },
    "keyword3" : {
      "value": rewardTime,
      "color":"#173177"
    },
    "remark":{
      "value":"\n如有问题请在汇邻优店公众号内留言，小汇将第一时间为您服务！",
      "color":"#173177"
    }
  }

  return new Promise((resolve, reject) => {
    wechat_api.sendTemplate(openid, templateId, url, data, function (err, result) {
      if(!err) {
        return resolve()
      } else {
        return reject()
      }
    })
  })
}

/**
 * 发送邀请店铺收益通知消息
 * @param {String} openid 用户的openid
 * @param {Number} amount 支付金额
 * @param {Date} created 店铺注册时间
 */
function sendInviteShopTmpMsg(openid, amount, created) {
  var templateId = GLOBAL_CONFIG.SHOP_TMP_ID
  var url = ""
  var title = "恭喜您成功邀请新店铺，获得" + amount.toFixed(2) + "元收益\n"
  var paymentTime = created.toLocaleString()

  var data = {
    "first": {
      "value": title,
      "color":"#173177"
    },
    "keyword1": {
      "value": "店铺注册",
      "color":"#173177"
    },
    "keyword2" : {
      "value": paymentTime,
      "color":"#173177"
    },
    "remark":{
      "value":"\n您的努力初见成效，再接再励哟。",
      "color":"#173177"
    }
  }

  return new Promise((resolve, reject) => {
    wechat_api.sendTemplate(openid, templateId, url, data, function (err, result) {
      if(!err) {
        return resolve()
      } else {
        return reject()
      }
    })
  })
}

/**
 * 店铺新订单通知
 * @param {String} username 客户
 * @param {String} openid 客户的openid
 * @param {Number} amount 支付金额
 * @param {String} order_no 订单号
 * @param {Date} created 店铺注册时间
 */
function sendNewGoodsTmpMsg(username, openid, amount, order_no, created) {
  var templateId = GLOBAL_CONFIG.GOODS_TMP_ID
  var orderAmount = '¥' + amount.toFixed(2) +'元'
  var orderTime = created.toLocaleString()

  var url = ""

  var data = {
    "first": {
      "value": "您好，您收到一个新的订单\n",
      "color":"#173177"
    },
    "keyword1": {
      "value": username,
      "color":"#173177"
    },
    "keyword2" : {
      "value": orderAmount,
      "color":"#173177"
    },
    "keyword3" : {
      "value": order_no,
      "color":"#173177"
    },
    "keyword4" : {
      "value": orderTime,
      "color":"#173177"
    },
    "remark":{
      "value":"\n请及时联系客户",
      "color":"#173177"
    }
  }

  return new Promise((resolve, reject) => {
    wechat_api.sendTemplate(openid, templateId, url, data, function (err, result) {
      if(!err) {
        return resolve()
      } else {
        return reject()
      }
    })
  })
}

/**
 * 提现成功通知
 * @param {String} openid 客户的openid
 * @param {Number} amount 提现金额
 * @param {String} account 提现账户
 * @param {String} channel 提现渠道  通联支付：allinpay 或者 微信公众号 wx_pub
 * @param {Date} created 店铺注册时间
 */
function sendWithdrawTmpMsg(openid, amount, account, channel, created) {
  var templateId = GLOBAL_CONFIG.WITHDRAW_TMP_ID
  var withDrawAmount = '¥' + amount.toFixed(2) +'元'
  var withDrawTime = created.toLocaleString()
  var remark = "\n提现金额已到帐至您的微信零钱账户，敬请查收！"
  var withDrawAccount = ""
  var url = ""
  if(channel == 'allinpay') {
    withDrawAccount = "银行账户（" + account + "）"
    remark = "\n提现金额已到帐至您的银行账户，敬请查收！"
  } else if( channel == 'wx_pub') {
    withDrawAccount = "微信账户（" + account + "）"
    remark = "\n提现金额已到帐至您微信零钱账户，敬请查收！"
  }

  var data = {
    "first": {
      "value": "你好！您的提现申请，已经审核完成。\n",
      "color":"#173177"
    },
    "keyword1": {
      "value": withDrawAmount,
      "color":"#173177"
    },
    "keyword2" : {
      "value": withDrawAccount,
      "color":"#173177"
    },
    "keyword3" : {
      "value": withDrawTime,
      "color":"#173177"
    },
    "remark":{
      "value": remark,
      "color":"#173177"
    }
  }

  return new Promise((resolve, reject) => {
    wechat_api.sendTemplate(openid, templateId, url, data, function (err, result) {
      if(!err) {
        return resolve()
      } else {
        return reject()
      }
    })
  })
}

/**
 * 邀请人通知
 * @param {String} openid 邀请者的openid
 * @param {String} username 用户姓名
 * @param {String} city  城市
 */
function sendInviterTmpMsg(openid, username, city) {
  var templateId = GLOBAL_CONFIG.INVITER_TMP_ID
  var url = ""

  var data = {
    "first": {
      "value": "恭喜您邀请到新的汇邻优店用户\n",
      "color":"#173177"
    },
    "keyword1": {
      "value": username,
      "color":"#173177"
    },
    "keyword2" : {
      "value": "未知",
      "color":"#173177"
    },
    "keyword3" : {
      "value": city,
      "color":"#173177"
    },
    "keyword4" : {
      "value": "登录注册",
      "color":"#173177"
    },
    "remark":{
      "value": "\n您的努力初见成效，再接再励哟。",
      "color":"#173177"
    }
  }

  return new Promise((resolve, reject) => {
    wechat_api.sendTemplate(openid, templateId, url, data, function (err, result) {
      if(!err) {
        return resolve()
      } else {
        return reject(err)
      }
    })
  })
}

function wechatMessageTest(request, response) {
  console.log("wechatMessageTest", request.params)
  var openid = request.params.openid
  var username = request.params.username
  var city = request.params.city

  sendInviterTmpMsg(openid, username, city).then(() => {
    response.success({

    })
  }).catch((error) => {
    console.log("sendInviterTmpMsg", error)
  })
}

var mpMsgFuncs = {
  sendRewardTmpMsg: sendRewardTmpMsg,
  sendInviteShopTmpMsg: sendInviteShopTmpMsg,
  sendNewGoodsTmpMsg: sendNewGoodsTmpMsg,
  sendWithdrawTmpMsg: sendWithdrawTmpMsg,
  sendInviterTmpMsg: sendInviterTmpMsg,
  wechatMessageTest: wechatMessageTest
}

module.exports = mpMsgFuncs