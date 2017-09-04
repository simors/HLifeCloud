/**
 * Created by wanpeng on 2017/7/15.
 */
var GLOBAL_CONFIG = require('../../config')

var wechat_api = require('../util/wechatUtil').wechat_api


function createMenu() {
  var memu = {
    "button":[
      {
        "type":"view",
        "name":"下载app",
        "url":"http://a.app.qq.com/o/simple.jsp?pkgname=com.hlife"
      },
      {
        'name': '一起来吧',
        'sub_button': [
          {
            "type":"click",
            "name":"我的二维码",
            "key":"MY_QRCODE"
          },
          {
            "type":"click",
            "name":"赚钱攻略",
            "key":"NEW_USER_GUIDE"
          },
        ]
      },
      {
        'name': '个人中心',
        'sub_button': [
          {
            "type":"view",
            "name":"我的钱包",
            "url": GLOBAL_CONFIG.MP_SERVER_DOMAIN + '/wxOauth'
          },
        ]
      }
    ]
  }

  wechat_api.createMenu(memu, function (err, result) {
    if(err) {
      console.log(err)
    } else if(result.errcode != 0) {
      console.log("微信公众号菜单创建异常：", result.errmsg)
    } else {
      console.log("微信公众号菜单创建成功")
    }
  })
}


var mpMenuFuncs = {
  createMenu: createMenu
}

module.exports = mpMenuFuncs