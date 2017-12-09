/**
 * Created by wanpeng on 2017/7/15.
 */
var GLOBAL_CONFIG = require('../../config')

var wechat_api = require('../util/wechatUtil').wechat_api


function createMenu() {
  var memu = {
    "button":[
      {
        "name": '天天福利',
        "sub_button": [
          {
            'type': 'view',
            'name': '眼明手快抢大奖',
            'url': 'http://15181462-25.hd.faisco.cn/15181462/6HdOxqLZJBcAoorKZgGYuQ/ymskqdj.html'
          },
          {
            'type': 'view',
            'name': '萌宠爱消除',
            'url': 'http://15181462-14.hd.faisco.cn/15181462/6HdOxqLZJBeN1Upv-D1mtg/mcaxc.html'
          },
        ]
      },
      {
        "name": '正能量',
        "sub_button": [
          {
            "type":"click",
            "name":"汇邻荐读",
            "key":"LIFE_SKILL"
          },
          {
            "type":"click",
            "name":"精彩美文",
            "key":"USER_HAVE_FUN"
          },
        ]
      },
      {
        'name': '个人中心',
        'sub_button': [
          {
            "type":"click",
            "name":"我的海报",
            "key":"MY_QRCODE"
          },
          {
            "type":"view",
            "name":"个人主页",
            "url": GLOBAL_CONFIG.MP_CLIENT_DOMAIN + '/mine'
          },
          {
            "type":"view",
            "name":"邻友圈",
            "url": GLOBAL_CONFIG.MP_CLIENT_DOMAIN + '/promoter'
          },
          {
            "type":"view",
            "name":"附近活动",
            "url": GLOBAL_CONFIG.MP_CLIENT_DOMAIN + '/promotion'
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