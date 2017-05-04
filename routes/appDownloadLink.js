/**
 * Created by wanpeng on 2017/5/3.
 */
/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var GLOBAL_CONFIG = require('../config');


router.get('/', function(req, res, next) {
  res.render('appDownloadLink', {
  })
});

module.exports = router;
