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
  res.reply({
    type: 'text',
    content: '请查看新手指引'
  })
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