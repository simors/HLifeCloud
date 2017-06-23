/**
 * Created by wanpeng on 2017/6/15.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var User = AV.Object.extend('_User');

router.get('/', function (req, res, next) {
  var phone = req.params.phone
  var unionid = req.params.unionid
  var avatar = undefined
  var query = new AV.Query(User)
  if(phone) {
    query.equalTo('mobilePhoneNumber', phone)
  }
  if(unionid) {
    query.equalTo('authData.weixin.openid', unionid)
  }

  query.first().then((userInfo) => {
    avatar = userInfo.attributes.avatar
    return AV.Cloud.run('hLifeGetPaymentInfoByUserId', {userId: userInfo.id})
  }).then((result) => {
    console.log("avatar", avatar)
    res.render('wxProfile', {
      avatar: avatar,
      balance: result.balance,
    })
  }).catch((error) => {
    res.render('wxProfile', {
      avatar: avatar,
      balance: 0,
    })
  })

})


module.exports = router