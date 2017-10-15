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
            res.reply({
              type: 'image',
              content: {
                mediaId: qrcode.mediaId
              }
            })
          } else {
            PromoterFunc.createPromoterQrCode(user.id).then((qrcode) => {
              console.log('send a new generated qrcode:', qrcode)
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
          content: "汇邻优店欢迎您 " + "<a href='" + GLOBAL_CONFIG.MP_CLIENT_DOMAIN + "/wallet" + "'>登录微信</a>" + " 获取专属二维码  祝您愉快！"
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
  getMaterialIdByName('news', '汇邻优店推广等级和奖励说明').then((mediaId) => {
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
    console.log('send customer news error', err)
  })
  res.reply('')
}

var lifeSkill = function (req, res, next) {
  var message = req.weixin
  var openid = message.FromUserName
  getMaterialIdByName('news', '生活美学').then((mediaId) => {
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
    console.log('send customer news error', err)
  })
  res.reply('')
}

var haveFun = function (req, res, next) {
  var message = req.weixin
  var openid = message.FromUserName
  getMaterialIdByName('news', '生活其实很好玩').then((mediaId) => {
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
    console.log('send customer news error', err)
  })
  res.reply('')
}

var exeClickEvent = {
  MY_QRCODE: generateQrcode,
  NEW_USER_GUIDE: newUserGuide,
  EARN_STRATEGY: earnStrategy,
  LIFE_SKILL: lifeSkill,
  USER_HAVE_FUN: haveFun,
}

function wechatServer(req, res, next) {
  var message = req.weixin;
  switch (message.MsgType) {
    case 'text':
      let content = message.Content
      var openid = message.FromUserName
      let isReply = false
      if (content == '杯子') {
        getMaterialIdByName('image', '杯子.jpg').then((mediaId) => {
          if (!mediaId) {
            console.log('can\'t find voice media')
            return
          }
          wechat_api.sendImage(openid, mediaId, function (err, result) {
            if (err) {
              console.log('customer message err', err)
            }
          })
        }, (err) => {
          console.log('send customer voice error')
        })
      } else if (content == '聪明') {
        isReply = true
        res.reply('01.化整为零 � �02.网开一面\n03.心花怒放 � �04.血口喷人\n05.引人入胜 � �06.火冒三丈\n07.面黄肌瘦� �08.无的放矢\n09.雌雄难辨� �10.隔岸观火')
      } else {
        isReply = true
        res.reply('欢迎')
      }
      if (!isReply) {
        res.reply('')
      }
      break;
    case 'event':
      if(message.Event === 'CLICK') {
        exeClickEvent[message.EventKey](req, res, next)
      } else if(message.Event === 'subscribe') {
        console.log('message', message)
        var scene_id = message.EventKey
        var openid = message.FromUserName
        var upUser_unionid = scene_id.slice(8)
        getMaterialIdByName('image', 'welcome_focus.png').then((mediaId) => {
          if (!mediaId) {
            console.log('can\'t find image media')
            return
          }
          wechat_api.sendImage(openid, mediaId, function (err, result) {
            if (err) {
              console.log('customer message err', err)
            }
          })
        }, (err) => {
          console.log('send customer image error')
        })
        wechat_api.getUser(openid, function (err, result) {
          if(!err && upUser_unionid) {
            utilFunc.bindWechatUnionid(upUser_unionid, result.unionid)
          } else {
            console.log("subscribe", err)
          }
          authFunc.getUserByUnionId(upUser_unionid).then((upUser) => {
            mpMsgFuncs.sendSubTmpMsg(upUser.attributes.openid, result.nickname, result.city)
          })
          res.reply('')
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