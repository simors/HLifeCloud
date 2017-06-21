/**
 * Created by wanpeng on 2017/6/15.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');

router.get('/', function (req, res, next) {
  var openid = req.query.openid;

  res.render('wxWithdraw', {
    openid: openid,
  })
})

module.exports = router