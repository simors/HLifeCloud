/**
 * Created by wanpeng on 2017/6/22.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var User = AV.Object.extend('_User');

router.get('/', function (req, res, next) {

  res.render('wxSignIn', {
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
    accessToken: "",
    unionid: "",
    expires_in: "",
    openid: '',
  })

})


module.exports = router