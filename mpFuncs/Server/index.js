/**
 * Created by wanpeng on 2017/7/15.
 */
var Promise = require('bluebird');
var wechat = require('wechat');
var AV = require('leanengine');
var math = require('mathjs')
var GLOBAL_CONFIG = require('../../config')
var utilFunc = require('../../cloudFuncs/util')
var getMaterialIdByName = require('../Material').getMaterialIdByName
var PromoterFunc = require('../../cloudFuncs/Promoter')
var authFunc = require('../../cloudFuncs/Auth')
var mpMsgFuncs = require('../Message')

var wechat_api = require('../util/wechatUtil').wechat_api

var generateQrcode = function (req, res, next) {
  var message = req.weixin
  if (message.Event != 'CLICK') {
    return
  }
  var openid = message.FromUserName
  wechat_api.getUser(openid, function (err, result) {
    if (err) {
      console.log("微信api getUser", err)
      res.reply({
        type: 'text',
        content: '获取信息失败'
      })
      return
    }
    var unionid = result.unionid
    var query = new AV.Query('_User')
    query.equalTo("authData.weixin.openid", unionid)
    query.first().then((user) => {
      if (user && user.attributes.authData) {
        PromoterFunc.getPromoterByUserId(user.id).then((promoter) => {
          if (!promoter) {
            console.log('can\'t find promoter')
            res.reply('')
            return
          }
          let qrcode = promoter.attributes.qrcode
          let nowTime = (new Date()).getTime()
          if (qrcode && qrcode.createdTime && qrcode.mediaId && (math.chain(nowTime).subtract(qrcode.createdTime).done() < (60*60*24*2*1000))) {
            console.log('send qrcode exist', qrcode)
            getMaterialIdByName('voice', '生成二维码.mp3').then((mediaId) => {
              if (!mediaId) {
                console.log('can\'t find voice media')
                return
              }
              wechat_api.sendVoice(openid, mediaId, function (err, result) {
                if (err) {
                  console.log('customer message err', err)
                }
              })
            }, (err) => {
              console.log('send customer voice error')
            }).catch((error) => {
              console.log("generateQrcode", error)
              res.reply({
                type: 'text',
                content: ""
              })
            })
            res.reply({
              type: 'image',
              content: {
                mediaId: qrcode.mediaId
              }
            })
          } else {
            PromoterFunc.createPromoterQrCode(user.id).then((qrcode) => {
              console.log('send a new generated qrcode:', qrcode)
              getMaterialIdByName('voice', '生成二维码.mp3').then((mediaId) => {
                if (!mediaId) {
                  console.log('can\'t find voice media')
                  return
                }
                wechat_api.sendVoice(openid, mediaId, function (err, result) {
                  if (err) {
                    console.log('customer message err', err)
                  }
                })
              }, (err) => {
                console.log('send customer voice error')
              })
              res.reply({
                type: 'image',
                content: {
                  mediaId: qrcode.mediaId
                }
              })
              return PromoterFunc.updatePromoterQrCode(user.id, qrcode)
            }).catch((error) => {
              console.log("generateQrcode", error)
              res.reply({
                type: 'text',
                content: ""
              })
            })
          }
        })
      } else {
        res.reply({
          type: 'text',
          content: "汇邻优店欢迎您 " + "<a href='" + GLOBAL_CONFIG.MP_SERVER_DOMAIN + "/wxOauth" + "'>登录微信</a>" + " 获取专属二维码  祝您愉快！"
        })
      }
    })
  })
}

var newUserGuide = function (req, res, next) {
  var message = req.weixin
  var openid = message.FromUserName
  getMaterialIdByName('news', '汇邻优店的商业价值').then((mediaId) => {
    if (!mediaId) {
      console.log('can\'t find news media')
      return
    }
    wechat_api.sendMpNews(openid, mediaId, function (err, result) {
      if (err) {
        console.log('customer news err', err)
      }
    })
  }, (err) => {
    console.log('send customer news error')
  })
  res.reply('')
}

var earnStrategy = function (req, res, next) {
  var message = req.weixin
  var openid = message.FromUserName
  getMaterialIdByName('news', '汇邻优店的推广等级和奖励说明').then((mediaId) => {
    if (!mediaId) {
      console.log('can\'t find news media')
      return
    }
    wechat_api.sendMpNews(openid, mediaId, function (err, result) {
      if (err) {
        console.log('customer news err', err)
      }
    })
  }, (err) => {
    console.log('send customer news error')
  })
  res.reply('')
}

var exeClickEvent = {
  MY_QRCODE: generateQrcode,
  NEW_USER_GUIDE: newUserGuide,
  EARN_STRATEGY: earnStrategy,
}

function wechatServer(req, res, next) {
  var message = req.weixin;
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
        console.log('message', message)
        var scene_id = message.EventKey
        var openid = message.FromUserName
        var upUser_unionid = scene_id.slice(8)
        getMaterialIdByName('voice', '开始录音.mp3').then((mediaId) => {
          if (!mediaId) {
            console.log('can\'t find voice media')
            return
          }
          wechat_api.sendVoice(openid, mediaId, function (err, result) {
            if (err) {
              console.log('customer message err', err)
            }
          })
        }, (err) => {
          console.log('send customer voice error')
        })
        wechat_api.getUser(openid, function (err, result) {
          if(!err && upUser_unionid) {
            utilFunc.bindWechatUnionid(upUser_unionid, result.unionid)
          } else {
            console.log("subscribe", err)
          }
          // res.reply({
          //   type: 'text',
          //   content: "亲爱的邻友 欢迎您  👉 点击公众号菜单栏👉  一起来吧  👉 我的二维码👉   生成二维码  👉 将二维 码发送给微信好友 微信群或者朋友圈 朋友通过您的二维码识别关注  您将能获得财富 邻友发展的越多 您的收益会越大  生成二维码群发吧 祝您生活愉快 加油👊\n点击<a href='" + GLOBAL_CONFIG.MP_SERVER_DOMAIN + "/wxOauth" + "'>登录微信</a>" +"体验更多功能。"
          // })
          authFunc.getUserByUnionId(upUser_unionid).then((upUser) => {
            mpMsgFuncs.sendSubTmpMsg(upUser.attributes.openid, result.nickname, result.city)
          })
          res.reply('👇生成海报 了解汇邻')
        })
      } else if(message.Event === 'SCAN') {
        var upUser_unionid = message.EventKey
        var openid = message.FromUserName

        wechat_api.getUser(openid, function (err, result) {
          if(!err && upUser_unionid) {
            utilFunc.bindWechatUnionid(upUser_unionid, result.unionid)
          } else {
            console.log("subscribe", err)
          }
          res.reply({
            type: 'text',
            content: "欢迎回到汇邻优店"
          })
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