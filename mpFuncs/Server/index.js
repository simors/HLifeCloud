/**
 * Created by wanpeng on 2017/7/15.
 */
var Promise = require('bluebird');
var wechat = require('wechat');
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../../config')
var utilFunc = require('../../cloudFuncs/util')
var getMaterialIdByName = require('../Material').getMaterialIdByName

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
              getMaterialIdByName('voice', '二维码生成2.mp3').then((mediaId) => {
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
              wechat_api.sendText(openid, "亲！您的二维码已经生成，现已是汇邻优店的亲密邻友，您可以上传你的店铺到APP平台，引导新客增收👉 最重要的是，现在只要分享您的二维码，通过扫您的二维码加入的邻友，上传商铺和在汇邻优店里消费，您都将获得财富，积极参与，让我们一起来吧！👯 群发二维码！ 祝您生意兴隆，财源滚滚！", (err, result) => {
                if (err) {
                  console.log('send text after generate qrcode error.', err)
                }
              })
              res.reply({
                type: 'image',
                content: {
                  mediaId: result.qrcode.mediaId
                }
              })
            } else {
              res.reply({
                type: 'text',
                content: "感谢关注汇邻优店！您还没有完成注册，请先点击\n" + "<a href='" + GLOBAL_CONFIG.MP_SERVER_DOMAIN + "/wxOauth" + "'>登录微信</a>" +"完成注册授权后再生成二维码。"
              })
            }
          })

        } else {
          res.reply({
            type: 'text',
            content: "感谢关注汇邻优店！您还没有登录，请点击\n" + "<a href='" + GLOBAL_CONFIG.MP_SERVER_DOMAIN + "/wxOauth" + "'>登录微信</a>" +"完成登录后，再生成二维码。"
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
      title: '如何在汇邻优店赚到钱',
      description: '',
      picurl: 'https://mmbiz.qlogo.cn/mmbiz_png/9jgnpibfyJptQC23DAdc5obxEdeudArZTIgr1peniakr8Ts9V8mich84JFMMmnsR9Sicgic2Erf8uBLJP69kj12RhKA/0?wx_fmt=png',
      url: 'http://mp.weixin.qq.com/s/kX1I5ZPmRjutqP1LHksf1w'
    },
    {
      title: '线下推广技巧',
      description: '',
      picurl: 'https://mmbiz.qlogo.cn/mmbiz_png/9jgnpibfyJptQC23DAdc5obxEdeudArZTKiaM6b7vEFUliar6UzXAjJTQ61ibERXuryTUQTpve0ONegX5BckN8juYw/0?wx_fmt=png',
      url: 'https://mp.weixin.qq.com/s/qFVL1R6RG7sjbzB0JHrUfQ'
    },
    {
      title: '推广等级和奖励制度',
      description: '',
      picurl: 'https://mmbiz.qlogo.cn/mmbiz_png/9jgnpibfyJpvnlz5dx9YwT39ahyhQ5ia8RCickyuOzzxS6QvIKFuiaPQM3ibywbOia13lcOmhecUbwloFD1LaFkicNuQw/0?wx_fmt=png',
      url: 'http://mp.weixin.qq.com/s/O7cxR86KpQxWutC8rqk5RQ'
    },
    {
      title: '推广技巧与转发分享的话术',
      description: '',
      picurl: 'https://mmbiz.qlogo.cn/mmbiz_png/9jgnpibfyJptrCwBqibTZDRyHM4QibxBxKFVOy6DSwLBWHuHwxicvFVXDUKKT6zVG3icvcTiaawkg07qFWoibUsdPKCyQ/0?wx_fmt=png',
      url: 'http://mp.weixin.qq.com/s/kxyWIPGMl0TRvsTGiS8WPg'
    },
    {
      title: '善芳分享：如何快速组建团队，复制团队三部曲',
      description: '',
      picurl: 'https://mmbiz.qlogo.cn/mmbiz_png/9jgnpibfyJptMY1crjuQLfTicic4pE6nicfuJSb8Nk2Hib4S9iajYCxibW2fMia732DNPaHFoAufcIQ106y9vA2bVIB95A/0?wx_fmt=png',
      url: 'http://mp.weixin.qq.com/s/FWE3DPw0q0h2Vopf5q9j8g'
    },
    {
      title: '团队打造12字秘诀',
      description: '',
      picurl: 'https://mmbiz.qlogo.cn/mmbiz_png/9jgnpibfyJptMY1crjuQLfTicic4pE6nicfu7C4ZQ6YWzPW6pgQrMMmtSgXicq6GWP7e0hRl7FIcXLDeaN98MoMJhUQ/0?wx_fmt=png',
      url: 'http://mp.weixin.qq.com/s/nM4N9-dyYUTzwwQkxRHfFg'
    },
    {
      title: '团队管理之破冰法则',
      description: '',
      picurl: 'https://mmbiz.qlogo.cn/mmbiz_png/9jgnpibfyJpvBibR9Z5T6vPw082SNMplicph7JYlrqon7TF9CxquMryUSNgUJ3tDhQHZCIoEXjHQIRj0YFDBXzicgA/0?wx_fmt=png',
      url: 'http://mp.weixin.qq.com/s/8RucASIX5OeDkmq0A1X18Q'
    },
  ])
}

var exeClickEvent = {
  MY_QRCODE: generateQrcode,
  NEW_USER_GUIDE: newUserGuide,
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
        var scene_id = message.EventKey
        var openid = message.FromUserName
        var upUser_unionid = scene_id.slice(8)
        getMaterialIdByName('voice', '开始语音2(1).mp3').then((mediaId) => {
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
          if(!err) {
            utilFunc.bindWechatUnionid(upUser_unionid, result.unionid)
          } else {
            console.log("subscribe", err)
          }
          res.reply({
            type: 'text',
            content: "亲爱的邻友 欢迎您  👉 点击公众号菜单栏👉  一起来吧  👉 我的二维码👉   生成二维码  👉 将二维 码发送给微信好友 微信群或者朋友圈 朋友通过您的二维码识别关注  您将能获得财富 邻友发展的越多 您的收益会越大  生成二维码群发吧 祝您生活愉快 加油👊\n点击<a href='" + GLOBAL_CONFIG.MP_SERVER_DOMAIN + "/wxOauth" + "'>登录微信</a>" +"体验更多功能。"
          })
        })
      } else if(message.Event === 'SCAN') {
        var upUser_unionid = message.EventKey
        var openid = message.FromUserName

        wechat_api.getUser(openid, function (err, result) {
          if(!err) {
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