/**
 * Created by wanpeng on 2017/6/15.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var PingppFunc = require('../cloudFuncs/Pingpp')

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var User = AV.Object.extend('_User');

router.get('/', function (req, res, next) {

  var unionid = req.query.unionid
  var openid = req.query.openid
  var userId = undefined
  var avatar = undefined
  var nickname = undefined

  if(!unionid || !openid) {
    next("参数错误！")
  }

  var query = new AV.Query(User)
  query.equalTo('authData.weixin.openid', unionid)
  query.first().then((userInfo) => {
    userId = userInfo.id
    avatar = userInfo.attributes.avatar
    nickname = userInfo.attributes.nickname
    return PingppFunc.fetchPaymentInfoByUserId(userId)
  }).then((result) => {
    var balance = result.balance.toFixed(2)
    res.render('wxProfile', {
      userId: userId,
      unionid: unionid,
      openid: openid,
      avatar: avatar,
      balance: balance,
      nickname: nickname,
    })
  }).catch((error) => {
    res.render('wxProfile', {
      userId: userId,
      unionid: unionid,
      openid: openid,
      nickname: nickname,
      avatar: avatar,
      balance: 0,
    })
  })

})


module.exports = router