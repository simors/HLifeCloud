/**
 * Created by wanpeng on 2017/6/15.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');


router.get('/', function (req, res, next) {
  var openid = req.query.openid;
  var balance = req.query.balance;

  console.log("req.query:", req.query)

  res.render('wxWithdraw', {
    openid: openid,
    balance: balance,
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
  })
})

module.exports = router