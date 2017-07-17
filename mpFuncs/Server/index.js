/**
 * Created by wanpeng on 2017/7/15.
 */
var wechat = require('wechat');
var WechatAPI = require('wechat-api');
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../../config')

var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret);

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
      if(message.Event === 'CLICK' && message.EventKey === 'MY_QRCODE') {
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