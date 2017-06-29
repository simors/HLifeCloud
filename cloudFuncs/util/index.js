/**
 * Created by yangyang on 2017/3/23.
 */
'use strict'

var inviteCodeFunc = require('./inviteCode')
var wechatBoundOpenidFunc = require('./wechatBoundOpenid')

var utilFunc = {
  getInvitationCode: inviteCodeFunc.getInvitationCode,
  verifyInvitationCode: inviteCodeFunc.verifyInvitationCode,
  bindWechatOpenid: wechatBoundOpenidFunc.bindWechatOpenid,
  getWechatUpUserOpenid: wechatBoundOpenidFunc.getWechatUpUserOpenid,
}

module.exports = utilFunc