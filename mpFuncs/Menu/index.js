/**
 * Created by wanpeng on 2017/7/15.
 */
var GLOBAL_CONFIG = require('../../config')

var wechat_api = require('../util/wechatUtil').wechat_api

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
            "url": GLOBAL_CONFIG.MP_CLIENT_DOMAIN + '/promoter/performance/1'
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