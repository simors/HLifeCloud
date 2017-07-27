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
var client = require('../mpFuncs/util/wechatUtil').oauth_client


// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Topics = AV.Object.extend('Topics');

router.get('/:id', function (req, res, next) {
  var userId = req.query.userId
  var topicId = req.params.id

  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/topicShare/callback/' + topicId
  if(userId) {
    var url = client.getAuthorizeURL(auth_callback_url, userId, 'snsapi_base')
    res.redirect(url)
  } else {
    res.redirect(auth_callback_url)
  }
})

router.get('/callback/:id', function (req, res, next) {
  var code = req.query.code
  var topicId = req.params.id
  var userId = req.query.state
  var current_unionid = undefined
  console.log("code:", code)
  console.log("userId:", userId)

  if(code && userId) {
    mpAuthFuncs.getAccessToken(code).then((result) => {
      current_unionid = result.data.unionid

      return authFunc.getUnionidById(userId)
    }).then((unionid) => {
      console.log("bind unionid", unionid, current_unionid)
      return utilFunc.bindWechatUnionid(unionid, current_unionid)
    }).then(() => {
      var query = new AV.Query(Topics)
      query.include('user')
      return query.get(topicId)
    }).then((topic) => {

      topicFunc.getTopicComments(topicId).then((results) => {
        var comments = []
        if(results && results.length > 0) {
          comments = results
        }

        var topicInfo = topic.attributes

        var user = topicInfo.user.attributes
        var status = topicInfo.status
        var createdAt = new Date(topic.createdAt.valueOf())
        if(status) {
          res.render('topicShare', {
            title: topicInfo.title || '优店话题',
            content: JSON.parse(topicInfo.content) || null,
            abstract: topicInfo.abstract || '优店话题摘要',
            author: user.nickname || '邻家小二',
            comments: comments,
            timestamp: util.getConversationTime(createdAt.getTime()),
            appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
          })
        } else {
          res.render('shareError', {
            title: topicInfo.title || '优店话题',
            message: "话题文章已经被删除！",
            appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
          });
        }
      }).catch((error) => {
        console.log("getTopicComments", error)
        throw error
      })
    }).catch((error) => {
      console.log("TopicShare error:", error)
      res.render('wxError', {
        errorMessage: "话题分享失败",
      })
    })
  } else {
    var query = new AV.Query(Topics)
    query.include('user')
    query.get(topicId).then((topic) => {
      topicFunc.getTopicComments(topicId).then((results) => {
        var comments = []
        if(results && results.length > 0) {
          comments = results
        }

        var topicInfo = topic.attributes
        var user = topicInfo.user.attributes
        var status = topicInfo.status
        var createdAt = new Date(topic.createdAt.valueOf())
        if(status) {
          res.render('topicShare', {
            title: topicInfo.title || '优店话题',
            content: JSON.parse(topicInfo.content) || null,
            abstract: topicInfo.abstract || '优店话题摘要',
            author: user.nickname || '邻家小二',
            comments: comments,
            timestamp: util.getConversationTime(createdAt.getTime()),
            appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
          })
        } else {
          res.render('shareError', {
            title: topicInfo.title || '优店话题',
            message: "话题文章已经被删除！",
            appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
          });
        }
      }).catch((error) => {
        console.log("getTopicComments", error)
        throw error
      })
    }).catch((error) => {
      console.log("TopicShare error:", error)
      res.render('wxError', {
        errorMessage: "话题分享失败",
      })
    })
  }


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
//     })
//   })
// })


module.exports = router;
