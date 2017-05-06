/**
 * Created by wanpeng on 2017/5/3.
 */
/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var AppVersion = AV.Object.extend('AppVersion');


router.get('/', function(req, res, next) {
  var query = new AV.Query(AppVersion)
  query.limit(1)
  query.descending('createdAt')
  query.first().then((result) => {
    console.log("result:", result)
    var fileUrl = result.attributes.fileUrl
    res.render('appDownloadLink', {
      androidAppDownloadUrl: fileUrl || 'https://www.pgyer.com/pn66'
    })
  }).catch(() => {
    res.render('appDownloadLink', {
      androidAppDownloadUrl: 'https://www.pgyer.com/pn66'
    })
  })

});

module.exports = router;
