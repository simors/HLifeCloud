/**
 * Created by wanpeng on 2017/6/15.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');


router.get('/', function (req, res, next) {
  var openid = req.query.openid;

  console.log("render wxWithdraw.ejs")
  res.render('wxWithdraw', {
    openid: openid,
    balance: 14,
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
  })
})

module.exports = router