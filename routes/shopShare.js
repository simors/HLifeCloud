/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')
var client = require('../mpFuncs/util/wechatUtil').oauth_client
var mpAuthFuncs = require('../mpFuncs/Auth')
var authFunc = require('../cloudFuncs/Auth')
var utilFunc = require('../cloudFuncs/util')


// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Shop = AV.Object.extend('Shop');

router.get('/:id', function (req, res, next) {
  var userId = req.query.userId
  var ShopId = req.params.id

  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/shopShare/callback/' + ShopId
  if(userId && userId != 'undefined') {
    var url = client.getAuthorizeURL(auth_callback_url, userId, 'snsapi_userinfo')
    res.redirect(url)
  } else {
    res.redirect(auth_callback_url)
  }
})

router.get('/callback/:id', function (req, res, next) {
  var code = req.query.code
  var ShopId = req.params.id
  var userId = req.query.state
  var current_unionid = undefined

  if(code && userId) {
    mpAuthFuncs.getAccessToken(code).then((result) => {
      current_unionid = result.data.unionid

      return authFunc.getUnionidById(userId)
    }).then((unionid) => {
      if(!unionid) return undefined
      return utilFunc.bindWechatUnionid(unionid, current_unionid)
    }).then(() => {
      var query = new AV.Query(Shop)
      return query.get(ShopId)
    }).then((result) => {
      var shopInfo = result.attributes
      var status = shopInfo.status
      if(status === 1) {
        res.render('shopShare', {
          title: shopInfo.shopName || '汇邻优店',
          coverUrl: shopInfo.coverUrl || '',
          address: shopInfo.shopAddress || '未知地址',
          phone: shopInfo.contactNumber || '未知电话',
          openTime: shopInfo.openTime || '8:30-22:00',
          ourSpecial: shopInfo.ourSpecial || '没有特色就是最大的特色',
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        })
      } else {
        res.render('shareError', {
          title: shopInfo.title || '汇邻优店',
          message: "店铺已经被删除！",
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        });
      }
    }).catch((error) => {
      console.log("shopShare error:", error)
      res.render('wxError', {
        errorMessage: "店铺分享失败",
      })
    })
  } else {
    var query = new AV.Query(Shop)
    query.get(ShopId).then((result) => {
      var shopInfo = result.attributes
      var status = shopInfo.status
      if(status === 1) {
        res.render('shopShare', {
          title: shopInfo.shopName || '汇邻优店',
          coverUrl: shopInfo.coverUrl || '',
          address: shopInfo.shopAddress || '未知地址',
          phone: shopInfo.contactNumber || '未知电话',
          openTime: shopInfo.openTime || '8:30-22:00',
          ourSpecial: shopInfo.ourSpecial || '没有特色就是最大的特色',
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        })
      } else {
        res.render('shareError', {
          title: shopInfo.title || '汇邻优店',
          message: "店铺已经被删除！",
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        });
      }

    }).catch((error) => {
      console.log("shopShare error:", error)
      res.render('wxError', {
        errorMessage: "店铺分享失败",
      })
    })
  }
})


module.exports = router;
