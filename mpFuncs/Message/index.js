/**
 * Created by wanpeng on 2017/7/14.
 */
var GLOBAL_CONFIG = require('../../config')
var WechatAPI = require('wechat-api');

var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret);

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
  var url = "http://www.baidu.com"

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

function wechatMessageTest(request, response) {
  var openid = request.params.openid
  var amount = request.params.amount
  var title = request.params.title

  sendRewardTmpMsg(openid, amount, title, new Date()).then(() => {
    response.success({

    })
  })
}

var mpMsgFuncs = {
  sendRewardTmpMsg: sendRewardTmpMsg,
  wechatMessageTest: wechatMessageTest
}

module.exports = mpMsgFuncs