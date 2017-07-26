/**
 * Created by yangyang on 2017/3/23.
 */
'use strict'
var Promise = require('bluebird')
var fs = require('fs');


var inviteCodeFunc = require('./inviteCode')
var wechatBoundOpenidFunc = require('./wechatBoundOpenid')

function readFileAsyn(filePath, encoding) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, encoding, function (err, buffer) {
      if(err) {
        console.log("readFileAsyn", err)
        reject(err)
      }
      resolve(buffer)
    })
  })
}

var utilFunc = {
  getInvitationCode: inviteCodeFunc.getInvitationCode,
  verifyInvitationCode: inviteCodeFunc.verifyInvitationCode,
  bindWechatUnionid: wechatBoundOpenidFunc.bindWechatUnionid,
  getWechatUpUserUnionid: wechatBoundOpenidFunc.getWechatUpUserUnionid,
  readFileAsyn: readFileAsyn
}

module.exports = utilFunc