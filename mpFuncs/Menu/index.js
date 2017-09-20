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
        "name":"我的海报",
        "key":"MY_QRCODE"
      },
      {
        "type":"click",
        "name":"了解汇邻",
        "key":"NEW_USER_GUIDE"
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
            "type":"click",
            "name":"赚钱攻略",
            "key": "EARN_STRATEGY"
          },
          {
            "type":"view",
            "name":"下载app",
            "url":"http://a.app.qq.com/o/simple.jsp?pkgname=com.hlife"
          },
        ]
      }
    ]
  }

  wechat_api.createMenu(memu, function (err, result) {
    if(err) {
      console.log(err)
    } else if(result.errcode != 0) {
      console.log("微信公众号菜单创建异常：", result.err)
    } else {
      console.log("微信公众号菜单创建成功")
    }
  })
}


var mpMenuFuncs = {
  createMenu: createMenu
}

module.exports = mpMenuFuncs