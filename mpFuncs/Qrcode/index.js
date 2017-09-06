/**
 * Created by wanpeng on 2017/7/26.
 */
var wechat_api = require('../util/wechatUtil').wechat_api
var Promise = require('bluebird');


function createLimitQRCode(unionid) {
  return new Promise(function (resolve, reject) {
    wechat_api.createLimitQRCode(unionid, function (err, result) {
      if(err) {
        console.log("createLimitQRCode", err)
        reject(new Error("创建永久二维码失败"))
        return
      }
      var ticket = result.ticket
      var qrcodeUrl = wechat_api.showQRCodeURL(ticket)
      resolve(qrcodeUrl)
    })
  })
}

function createTmpQRCode(unionid, expire_seconds) {
  return new Promise(function (resolve, reject) {
    wechat_api.createTmpQRCode(unionid, expire_seconds, function (err, result) {
      if(err) {
        console.log("createTmpQRCode", err)
        reject(new Error("创建临时二维码失败"))
        return
      }
      var ticket = result.ticket
      var qrcodeUrl = wechat_api.showQRCodeURL(ticket)
      resolve(qrcodeUrl)
    })
  })
}

var mpQrcodeFuncs = {
  createLimitQRCode: createLimitQRCode,
  createTmpQRCode: createTmpQRCode,
}

module.exports = mpQrcodeFuncs