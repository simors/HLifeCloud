/**
 * Created by wanpeng on 2017/5/5.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');


// 查询 Todo 列表
router.get('/', function(req, res, next) {
  res.render('download', {

  })
})

module.exports = router;
