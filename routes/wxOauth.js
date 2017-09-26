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
var utilFunc = require('../cloudFuncs/util')
var querystring = require('querystring')
var GLOBAL_CONFIG = require('../config')

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

router.get('/clientAuth', function (req, res, next) {
  var code = req.query.code
  var state = req.query.state
  var accessToken = undefined
  var openid = undefined
  var unionid = undefined
  var expires_in = undefined
  var authData = undefined
  let redurl = ''

  var currentUserNickname = undefined
  var currentUserCity = undefined

  console.log('receive wechat code: ', code)

  mpAuthFuncs.getAccessToken(code).then((result) => {
    accessToken = result.data.access_token;
    openid = result.data.openid
    unionid = result.data.unionid
    expires_in = result.data.expires_in
    authData = {
      "openid": unionid,
      "access_token": accessToken,
      "expires_at": Date.parse(expires_in),
    }

    return authFunc.isSignInByUnionId(unionid)
  }).then((result) => {
    if(!result) {
      mpAuthFuncs.getUserInfo(openid).then((userInfo) => {
        currentUserNickname = userInfo.nickname
        var headimgurl = userInfo.headimgurl
        currentUserCity = userInfo.city

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
        if(result) {
          var upUser = result.upUser
          var upUserTeamMemNum = result.upUserTeamMemNum
          if(upUser) {
            var upUserOpenid = upUser.attributes.openid
            mpMsgFuncs.sendInviterTmpMsg(upUserOpenid, currentUserNickname, currentUserCity, upUserTeamMemNum + 1)
          }
        }

        redurl = state + '?' + querystring.stringify(authData)
        res.redirect(redurl)
      }).catch((error) => {
        throw error
      })
    } else {
      authFunc.setUserOpenid(openid, unionid).then(() => {
        redurl = state + '?' + querystring.stringify(authData)
        res.redirect(redurl)
      })
    }
  }).catch((error) => {
    console.log(error)
    redurl = GLOBAL_CONFIG.MP_CLIENT_DOMAIN + '/error'
    res.redirect(redurl)
  })
})

router.get('/shareAuth', function (req, res, next) {
  var code = req.query.code
  var state = req.query.state
  let current_unionid = undefined
  let redurl = ''

  let stateObj = JSON.parse(state)
  console.log('receive code: ', code)
  console.log('get state user and nextPathname:', stateObj)

  mpAuthFuncs.getAccessToken(code).then((result) => {
    current_unionid = result.data.unionid

    return authFunc.getUnionidById(stateObj.userId)
  }).then((unionid) => {
    if(!unionid) return undefined
    return utilFunc.bindWechatUnionid(unionid, current_unionid)
  }).then(() => {
    let queryData = {
      unionid: current_unionid
    }
    redurl = stateObj.nextPathname + '?' + querystring.stringify(queryData)
    res.redirect(redurl)
  }).catch((error) => {
    console.log(error)
    redurl = GLOBAL_CONFIG.MP_CLIENT_DOMAIN + '/error'
    res.redirect(redurl)
  })
})

module.exports = router