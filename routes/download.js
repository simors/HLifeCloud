/**
 * Created by wanpeng on 2017/5/5.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')
var client = require('../mpFuncs/util/wechatUtil').oauth_client
var mpAuthFuncs = require('../mpFuncs/Auth')
var authFunc = require('../cloudFuncs/Auth')
var utilFunc = require('../cloudFuncs/util')

var AppVersion = AV.Object.extend('AppVersion');

router.get('/', function (req, res, next) {
  var userId = req.query.userId

  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/download/callback'
  if(userId && userId != 'undefined') {
    var url = client.getAuthorizeURL(auth_callback_url, userId, 'snsapi_base')
    res.redirect(url)
  } else {
    res.redirect(auth_callback_url)
  }
})

router.get('/callback', function (req, res, next) {
  var code = req.query.code
  var userId = req.query.state
  var current_unionid = undefined

  if(code) {
    mpAuthFuncs.getAccessToken(code).then((result) => {
      current_unionid = result.data.unionid

      return authFunc.getUnionidById(userId)
    }).then((unionid) => {
      return utilFunc.bindWechatUnionid(unionid, current_unionid)
    }).then(() => {
      var query = new AV.Query(AppVersion)
      query.limit(1)
      query.descending('createdAt')
      return query.first()
    }).then((result) => {
      var fileUrl = result.attributes.fileUrl
      res.render('download', {
        androidAppDownloadUrl: fileUrl || 'https://www.pgyer.com/pn66'
      })
    }).catch((error) => {
      console.log(error)
      res.render('download', {
        androidAppDownloadUrl: 'https://www.pgyer.com/pn66'
      })
    })
  } else {
    var query = new AV.Query(AppVersion)
    query.limit(1)
    query.descending('createdAt')
    query.first().then((result) => {
      var fileUrl = result.attributes.fileUrl
      res.render('download', {
        androidAppDownloadUrl: fileUrl || 'https://www.pgyer.com/pn66'
      })
    }).catch((error) => {
      console.log(error)
      res.render('download', {
        androidAppDownloadUrl: 'https://www.pgyer.com/pn66'
      })
    })
  }
})

module.exports = router;
