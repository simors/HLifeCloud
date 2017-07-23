/**
 * Created by wanpeng on 2017/7/15.
 */
var WechatAPI = require('wechat-api')
var GLOBAL_CONFIG = require('../../config')
var mpTokenFuncs = require('../Token')

var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret, mpTokenFuncs.getApiTokenFromRedis, mpTokenFuncs.setApiTokenToRedis)

function createMenu() {
  var memu = {
    "button":[
      {
        "type":"click",
        "name":"我的二维码",
        "key":"MY_QRCODE"
      },
      {
        "type":"view",
        "name":"下载app",
        "url":"http://a.app.qq.com/o/simple.jsp?pkgname=com.hlife"
      },
      {
        'name': '个人中心',
        'sub_button': [
          {
            "type":"view",
            "name":"我的钱包",
            "url": GLOBAL_CONFIG.MP_SERVER_DOMAIN + '/wxOauth'
          },
          {
            "type":"view",
            "name":"我的推广",
            "url": 'http://7550725b.ngrok.io'
          },
        ]
      }]
  }

  wechat_api.createMenu(memu, function (err, result) {
    if(result.errcode === 0) {
      console.log("微信公众号菜单创建成功")
    } else {
      console.log(err)
    }
  })
}


var mpMenuFuncs = {
  createMenu: createMenu
}

module.exports = mpMenuFuncs