/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')


// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Topics = AV.Object.extend('Topics');

// 查询 Topics 详情
router.get('/:id', function(req, res, next) {
  console.log("topic id:", req.params.id)
  var topicId = req.params.id;

  if(topicId) {
    var query = new AV.Query(Topics)

    query.get(topicId).then((result) => {
      console.log("topic result:", result)
      var topicInfo = result.attributes
      res.render('topicShare', {
        title: topicInfo.title || '优店话题',
        content: JSON.parse(topicInfo.content) || null,
        abstract: topicInfo.abstract || '优店话题摘要',
        appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
      })
    }).catch(next)
  } else {
    next(new Error('Failed to load ShopPromotion ' + req.params.id));
  }
});


module.exports = router;
