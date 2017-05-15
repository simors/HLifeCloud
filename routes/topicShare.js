/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')
var topicFunc = require('../cloudFuncs/Topic/')


// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Topics = AV.Object.extend('Topics');

// 查询 Topics 详情
router.get('/:id', function(req, res, next) {
  var topicId = req.params.id;

  if(topicId) {
    var query = new AV.Query(Topics)
    query.include('user')
    query.get(topicId).then((result) => {
      return result
    }).then((topic) => {
      topicFunc.getTopicComments(topicId).then((results) => {
        var comments = []
        if(results && results.length > 0) {
          comments = results
        }

        var topicInfo = topic.attributes
        var user = topicInfo.user.attributes
        var status = topicInfo.status
        if(status) {
          res.render('topicShare', {
            title: topicInfo.title || '优店话题',
            content: JSON.parse(topicInfo.content) || null,
            abstract: topicInfo.abstract || '优店话题摘要',
            author: user.nickname || '邻家小二',
            comments: comments,
            appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
          })
        } else {
          res.render('shareError', {
            title: topicInfo.title || '优店话题',
            message: "话题文章已经被删除！",
            appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
          });
        }
      })
    }).catch(next)
  } else {
    next(new Error('Failed to load Topics ' + req.params.id));
  }
});


module.exports = router;
