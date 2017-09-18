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

  var currentUserNickname = undefined
  var currentUserCity = undefined

  console.log('receive wechat code: ', code)

  mpAuthFuncs.getAccessToken(code).then((result) => {
    accessToken = result.data.access_token;
    openid = result.data.openid
    unionid = result.data.unionid
    expires_in = result.data.expires_in

    return authFunc.isSignInByUnionId(unionid)
  }).then((result) => {
    if(!result) {
      mpAuthFuncs.getUserInfo(openid).then((userInfo) => {
        currentUserNickname = userInfo.nickname
        var headimgurl = userInfo.headimgurl
        currentUserCity = userInfo.city
        var authData = {
          "openid": unionid,
          "access_token": accessToken,
          "expires_at": Date.parse(expires_in),
        }
        var platform = 'weixin'
        var leanUser = new AV.User()
        leanUser.set('type', 'normal')
        leanUser.set('nickname', currentUserNickname)
        leanUser.set('username', unionid)
        leanUser.set('avatar', headimgurl)
        leanUser.set('openid', openid)
        leanUser.set('geoCity', currentUserCity)
        return AV.User.associateWithAuthData(leanUser, platform, authData)
      }).then((user) => {
        return PromoterFunc.bindPromoterInfo(user.id)
      }).then((result) => {
        if(!result) {
          res.redirect('/wxProfile?unionid=' + unionid + '&openid=' + openid)
          return
        }
        var upUser = result.upUser
        var upUserTeamMemNum = result.upUserTeamMemNum
        if(upUser) {
          var upUserOpenid = upUser.attributes.openid
          mpMsgFuncs.sendInviterTmpMsg(upUserOpenid, currentUserNickname, currentUserCity, upUserTeamMemNum + 1)

        }
        res.redirect('/wxProfile?unionid=' + unionid + '&openid=' + openid)
      }).catch((error) => {
        throw error
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