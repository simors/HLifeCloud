/**
 * Created by wanpeng on 2017/6/14.
 */
'use strict';
var AV = require('leanengine');
var router = require('express').Router();
var mpAuthFuncs = require('../mpFuncs/Auth')
var authFunc = require('../cloudFuncs/Auth')
var PromoterFunc = require('../cloudFuncs/Promoter')
var mpMsgFuncs = require('../mpFuncs/Message')

router.get('/', mpAuthFuncs.userAuthRequest)

router.get('/callback', function (req, res, next) {
  var code = req.query.code
  var accessToken = undefined
  var openid = undefined
  var unionid = undefined
  var expires_in = undefined

  mpAuthFuncs.getAccessToken(code).then((result) => {
    accessToken = result.data.access_token;
    openid = result.data.openid
    unionid = result.data.unionid
    expires_in = result.data.expires_in

    return authFunc.isSignInByUnionId(unionid)
  }).then((result) => {
    if(!result) {
      mpAuthFuncs.getUserInfo(openid).then((userInfo) => {
        var nickname = userInfo.nickname
        var headimgurl = userInfo.headimgurl
        var city = userInfo.city
        var authData = {
          "openid": unionid,
          "access_token": accessToken,
          "expires_at": Date.parse(expires_in),
        }
        var platform = 'weixin'
        var leanUser = new AV.User()
        leanUser.set('type', 'normal')
        leanUser.set('nickname', nickname)
        leanUser.set('username', unionid)
        leanUser.set('avatar', headimgurl)
        leanUser.set('openid', openid)
        leanUser.set('geoCity', city)
        return AV.User.associateWithAuthData(leanUser, platform, authData)
      }).then((user) => {
        return PromoterFunc.bindPromoterInfo(user.id)
      }).then((upUser) => {
        if(upUser) {
          var upUserOpenid = upUser.attributes.openid
          authFunc.getUserById(upUser.id).then((leanUser) => {
            var nickname = leanUser.attributes.nickname
            var city = leanUser.attributes.geoCity
            mpMsgFuncs.sendInviterTmpMsg(upUserOpenid, nickname, city)
          })
        }
        res.redirect('/wxProfile?unionid=' + unionid + '&openid=' + openid)
      })
    } else {
      authFunc.setUserOpenid(openid, unionid).then(() => {
        res.redirect('/wxProfile?unionid=' + unionid + '&openid=' + openid)
      })
    }
  }).catch((error) => {
    console.log(error)
    res.redirect('/wxError')
  })
})

module.exports = router