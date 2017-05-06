/**
 * Created by wanpeng on 2017/5/5.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var AppVersion = AV.Object.extend('AppVersion');


// 查询 Todo 列表
router.get('/', function(req, res, next) {

  var query = new AV.Query(AppVersion)
  query.limit(1)
  query.descending('createdAt')
  query.first().then((result) => {
    var fileUrl = result.attributes.fileUrl
    res.render('download', {
      androidAppDownloadUrl: fileUrl || 'https://www.pgyer.com/pn66'
    })
  }).catch(() => {
    res.render('download', {
      androidAppDownloadUrl: 'https://www.pgyer.com/pn66'
    })
  })
})

module.exports = router;
