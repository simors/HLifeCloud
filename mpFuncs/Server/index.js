/**
 * Created by wanpeng on 2017/7/15.
 */
var wechat = require('wechat');
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../../config')

var wechat_api = require('../util/wechatUtil').wechat_api

var generateQrcode = function (req, res, next) {
  var message = req.weixin
  if(message.Event != 'CLICK') {
    return
  }
  var openid = message.FromUserName
  wechat_api.getUser(openid, function (err, result) {
    if(!err) {
      var unionid = result.unionid
      var query = new AV.Query('_User')
      query.equalTo("authData.weixin.openid", unionid)
      query.first().then((user) => {
        if(user && user.attributes.authData) {
          AV.Cloud.run('promoterGetPromoterQrCode', {unionid: unionid}).then((result) => {
            if(result.isSignIn && result.qrcode) {
              res.reply({
                type: 'image',
                content: {
                  mediaId: result.qrcode.mediaId
                }
              })
            } else {
              res.reply({
                type: 'text',
                content: "感谢关注汇邻优店！\n" + "<a href='" + GLOBAL_CONFIG.MP_SERVER_DOMAIN + "/wxOauth" + "'>登录微信</a>" +"体验更多功能。"
              })
            }
          })

        } else {
          res.reply({
            type: 'text',
            content: "感谢关注汇邻优店！\n" + "<a href='" + GLOBAL_CONFIG.MP_SERVER_DOMAIN + "/wxOauth" + "'>登录微信</a>" +"体验更多功能。"
          })
        }
      })
    } else {
      res.reply({
        type: 'text',
        content: '获取信息失败'
      })
    }
  })
}

var newUserGuide = function (req, res, next) {
  res.reply([
    {
      title: '汇邻优店推广规则介绍',
      description: '如何用人脉成为高富帅、白富美',
      picurl: 'http://www.07073.com/robotuploads/20170715/s1twjtse4cl.jpg',
      url: 'http://chanye.07073.com/guonei/1648610.html'
    },
    {
      title: '汇邻优店店铺入驻说明',
      description: '如何用人脉成为高富帅、白富美',
      picurl: 'http://inews.gtimg.com/newsapp_bt/0/1781612513/641',
      url: 'http://news.qq.com/a/20170717/010820.htm'
    },
    {
      title: '手机app下载',
      description: '如何用人脉成为高富帅、白富美',
      picurl: 'http://img2.utuku.china.com/640x0/news/20170715/b3cf1b7c-0ac7-4b9a-abf8-74d964ff207b.jpg',
      url: 'http://news.china.com/news100/11038989/20170716/30974415.html'
    },
  ])
}

var exeClickEvent = {
  MY_QRCODE: generateQrcode,
  NEW_USER_GUIDE: newUserGuide,
}

function wechatServer(req, res, next) {
  var message = req.weixin;
  console.log('weixin  message:', message)

  switch (message.MsgType) {
    case 'text':

      res.reply({
        type: 'text',
        content: '欢迎'
      })
      break;
    case 'event':
      if(message.Event === 'CLICK') {
        exeClickEvent[message.EventKey](req, res, next)
      } else if(message.Event === 'subscribe') {
        var scene_id = message.EventKey
        var openid = message.FromUserName
        var upUser_unionid = scene_id.slice(8)
        wechat_api.getUser(openid, function (err, result) {
          if(!err) {
            var unionid = result.unionid
            var params = {
              unionid: unionid,
              upUserUnionid: upUser_unionid
            }
            return AV.Cloud.run('utilBindWechatUnionid', params)
          } else {
            return Promise.resolve()
          }
        }).then(() => {
          res.reply({
            type: 'text',
            content: "感谢关注汇邻优店！\n" + "<a href='" + GLOBAL_CONFIG.MP_SERVER_DOMAIN + "/wxOauth" + "'>登录微信</a>" +"体验更多功能。"
          })
        }).catch((error) => {
          console.log("subscribe:", error)
        })
      }
      break
    default:
      break
  }
}

var mpServerFuncs = {
  wechatServer: wechatServer,
}

module.exports = mpServerFuncs