/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')
var topicFunc = require('../cloudFuncs/Topic')
var util = require('../utils/util');
var OAuth = require('wechat-oauth');
var mpAuthFuncs = require('../mpFuncs/Auth')
var authFunc = require('../cloudFuncs/Auth')
var utilFunc = require('../cloudFuncs/util')


var userId = undefined
var topicId = undefined

var client = new OAuth(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret);

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Topics = AV.Object.extend('Topics');

router.get('/:id/:userId', function (req, res, next) {
  userId = req.params.userId
  topicId = req.params.id

  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/topicShare/callback'
  var url = client.getAuthorizeURL(auth_callback_url, '', 'snsapi_base');
  console.log("redirect url:", url)
  res.redirect(url)
})

router.get('/callback', function (req, res, next) {
  var code = req.query.code

  mpAuthFuncs.getAccessToken(code).then((result) => {
    var accessToken = result.data.access_token;
    var openid = result.data.openid
    var unionid = result.data.unionid
    var expires_in = result.data.expires_in

    mpAuthFuncs.getUserInfo(openid).then((userInfo) => {
      console.log("userInfo", userInfo)
    })
  })
  res.render('wxError', {
    errorMessage: "test 测试",
  })
})

//
// router.get('/callback', function (req, res, next) {
//   var code = req.query.code
//   var upUser_unionId = undefined
//
//   console.log("callback code:", code)
//   authFunc.getUnionidById(userId).then((unionId) => {
//     upUser_unionId = unionId
//     return mpAuthFuncs.getAccessToken(code)
//   }).then((result) => {
//     var unionid = result.data.unionid
//     return utilFunc.bindWechatUnionid(upUser_unionId, unionid)
//   }).then(() => {
//     var query = new AV.Query(Topics)
//     query.include('user')
//     return query.get(topicId)
//   }).then((topic) => {
//     topicFunc.getTopicComments(topicId).then((results) => {
//       var comments = []
//       if(results && results.length > 0) {
//         comments = results
//       }
//
//       var topicInfo = topic.attributes
//       var user = topicInfo.user.attributes
//       var status = topicInfo.status
//       var createdAt = new Date(topic.createdAt.valueOf())
//       if(status) {
//         res.render('topicShare', {
//           title: topicInfo.title || '优店话题',
//           content: JSON.parse(topicInfo.content) || null,
//           abstract: topicInfo.abstract || '优店话题摘要',
//           author: user.nickname || '邻家小二',
//           comments: comments,
//           timestamp: util.getConversationTime(createdAt.getTime()),
//           appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
//         })
//       } else {
//         res.render('shareError', {
//           title: topicInfo.title || '优店话题',
//           message: "话题文章已经被删除！",
//           appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
//         });
//       }
//     })
//   }).catch((error) => {
//     console.log("TopicShare error:", error)
//     res.render('wxError', {
//       errorMessage: "话题分享失败",
//     })})
// })


module.exports = router;
