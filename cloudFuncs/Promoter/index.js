/**
 * Created by yangyang on 2017/3/23.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var inviteCodeFunc = require('../util/inviteCode')
var IDENTITY_PROMOTER = require('../../constants/appConst').IDENTITY_PROMOTER

function promoterCertificate(request, response) {
  var inviteCode = request.params.inviteCode
  inviteCodeFunc.verifyCode(inviteCode).then((reply) => {
    if (!reply) {
      response.error({
        errcode: 1,
        message: '验证码无效，请向推广员重新获取验证码',
      })
    }
    var currentUser = request.currentUser
    var name = request.params.name
    var phone = request.params.phone
    var cardId = request.params.cardId
    var address = request.params.address
    var upUserId = reply

    var Promoter = AV.Object.extend('Promoter')
    var promoter = new Promoter()
    var upUser = AV.Object.createWithoutData('_User', upUserId)

    upUser.fetch().then((upUserInfo) => {
      console.log('upUserInfo', upUserInfo)
      promoter.set('name', name)
      promoter.set('phone', phone)
      promoter.set('cardId', cardId)
      promoter.set('user', currentUser)
      promoter.set('address', address)
      promoter.set('upUser', upUserInfo)

      currentUser.addUnique('identity', IDENTITY_PROMOTER)
      currentUser.save().then(() => {
        return promoter.save()
      }).then((promoterInfo) => {
        response.success({
          errcode: 0,
          message: '注册推广员成功',
          promoter: promoterInfo,
        })
      }).catch((err) => {
        console.log("promoterCertificate", err.Error)
        response.error({
          errcode: 1,
          message: '注册推广员失败，请与客服联系',
        })
      })
    })
  })
}

var PromoterFunc = {
  promoterCertificate: promoterCertificate,
}

module.exports = PromoterFunc