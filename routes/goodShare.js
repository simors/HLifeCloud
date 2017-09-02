/**
 * Created by lilu on 2017/6/15.
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
var Good = AV.Object.extend('ShopGoods');

router.get('/:id', function (req, res, next) {
  var userId = req.query.userId
  var goodId = req.params.id

  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/goodShare/callback/' + goodId
  if(userId && userId != 'undefined') {
    var url = client.getAuthorizeURL(auth_callback_url, userId, 'snsapi_userinfo')
    res.redirect(url)
  } else {
    res.redirect(auth_callback_url)
  }
})

router.get('/callback/:id', function (req, res, next) {
  var code = req.query.code
  var goodId = req.params.id
  var userId = req.query.state
  var current_unionid = undefined

  if(code && userId) {
    mpAuthFuncs.getAccessToken(code).then((result) => {
      current_unionid = result.data.unionid

      return authFunc.getUnionidById(userId)
    }).then((unionid) => {
      return utilFunc.bindWechatUnionid(unionid, current_unionid)
    }).then(() => {
      var query = new AV.Query('ShopGoods')
      query.include('targetShop')
      return query.get(goodId)
    }).then((result) => {
      var goodInfo = result.attributes
      var shopInfo = goodInfo.targetShop.attributes
      var status = goodInfo.status
      if(status === 1) {
        res.render('goodShare', {
          goodTitle: goodInfo.goodsName || '汇邻优店',
          coverPhoto: goodInfo.coverPhoto || '',
          originalPrice: goodInfo.originalPrice || '',
          shopTitle: shopInfo.shopName || '汇邻优店',
          album:goodInfo.album || [],
          price: goodInfo.price || 0,
          detail: JSON.parse(goodInfo.detail) || [],
          phone: shopInfo.contactNumber || '未知电话',
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        })
      } else {
        res.render('shareError', {
          title: goodInfo.title || '汇邻优店',
          message: "商品已删除！",
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        });
      }
    }).catch((error) => {
      console.log("goodShare error:", error)
      res.render('wxError', {
        errorMessage: "商品分享失败",
      })
    })

  } else {
    var query = new AV.Query('ShopGoods')
    query.include('targetShop')
    query.get(goodId).then((result) => {
      var goodInfo = result.attributes
      // console.log('goodInf',goodInfo)
      var shopInfo = goodInfo.targetShop.attributes
      var status = goodInfo.status
      if(status === 1) {
        res.render('goodShare', {
          goodTitle: goodInfo.goodsName || '汇邻优店',
          coverPhoto: goodInfo.coverPhoto || '',
          originalPrice: goodInfo.originalPrice || '',
          shopTitle: shopInfo.shopName || '汇邻优店',
          album:goodInfo.album || [],
          price: goodInfo.price || 0,
          detail: JSON.parse(goodInfo.detail) || [],
          phone: shopInfo.contactNumber || '未知电话',
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        })
      } else {
        res.render('shareError', {
          title: goodInfo.title || '汇邻优店',
          message: "商品已删除！",
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        });
      }

    }).catch((error) => {
      console.log("goodShare error:", error)
      res.render('wxError', {
        errorMessage: "商品分享失败",
      })
    })
  }
})

module.exports = router;
