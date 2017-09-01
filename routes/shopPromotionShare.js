/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')

router.get('/:id', function (req, res, next) {
  var userId = req.query.userId
  var shopPromotionId = req.params.id

  var domain = GLOBAL_CONFIG.MP_SERVER_DOMAIN
  var auth_callback_url = domain + '/shopPromotionShare/callback/' + shopPromotionId
  if(userId && userId != 'undefined') {
    var url = client.getAuthorizeURL(auth_callback_url, userId, 'snsapi_base')
    res.redirect(url)
  } else {
    res.redirect(auth_callback_url)
  }
})

router.get('/callback/:id', function (req, res, next) {
  var code = req.query.code
  var shopPromotionId = req.params.id
  var userId = req.query.state
  var current_unionid = undefined

  if(code && userId) {
    mpAuthFuncs.getAccessToken(code).then((result) => {
      current_unionid = result.data.unionid

      return authFunc.getUnionidById(userId)
    }).then((unionid) => {
      return utilFunc.bindWechatUnionid(unionid, current_unionid)
    }).then(() => {
      var query = new AV.Query('ShopPromotion')
      query.equalTo('objectId', shopPromotionId)
      query.include('targetShop')
      return query.first()
    }).then((result) => {
      var shopPromotionInfo = result.attributes
      var targetShop = shopPromotionInfo.targetShop.attributes
      var status = shopPromotionInfo.status
      if(status) {
        res.render('shopPromotionShare', {
          title: shopPromotionInfo.title || '优店活动',
          coverUrl: shopPromotionInfo.coverUrl || '',
          type: shopPromotionInfo.type,
          abstract: shopPromotionInfo.abstract || '活动简介',
          shopName: targetShop.shopName || '汇邻优店',
          content: JSON.parse(shopPromotionInfo.promotionDetailInfo) || null,
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        })
      } else {
        res.render('shareError', {
          title: shopPromotionInfo.title || '优店活动',
          message: "店铺活动已经失效！",
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        });
      }
    }).catch((error) => {
      console.log("ShopPromotion error:", error)
      res.render('wxError', {
        errorMessage: "店铺活动分享失败",
      })
    })
  } else {
    var query = new AV.Query('ShopPromotion')
    query.equalTo('objectId', shopPromotionId)
    query.include('targetShop')

    query.first().then((result) => {
      var shopPromotionInfo = result.attributes
      var targetShop = shopPromotionInfo.targetShop.attributes
      var status = shopPromotionInfo.status
      if(status) {
        res.render('shopPromotionShare', {
          title: shopPromotionInfo.title || '优店活动',
          coverUrl: shopPromotionInfo.coverUrl || '',
          type: shopPromotionInfo.type,
          abstract: shopPromotionInfo.abstract || '活动简介',
          shopName: targetShop.shopName || '汇邻优店',
          content: JSON.parse(shopPromotionInfo.promotionDetailInfo) || null,
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        })
      } else {
        res.render('shareError', {
          title: shopPromotionInfo.title || '优店活动',
          message: "店铺活动已经失效！",
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        });
      }

    }).catch((error) => {
      console.log("ShopPromotion error:", error)
      res.render('wxError', {
        errorMessage: "店铺活动分享失败",
      })
    })
  }
})

// 查询 ShopPromotion 详情
router.get('/:id', function(req, res, next) {
  var shopPromotionId = req.params.id;

  if(shopPromotionId) {
    var query = new AV.Query('ShopPromotion')
    query.equalTo('objectId', shopPromotionId)
    query.include('targetShop')

    query.first().then((result) => {
      var shopPromotionInfo = result.attributes
      var targetShop = shopPromotionInfo.targetShop.attributes
      var status = shopPromotionInfo.status
      if(status) {
        res.render('shopPromotionShare', {
          title: shopPromotionInfo.title || '优店活动',
          coverUrl: shopPromotionInfo.coverUrl || '',
          type: shopPromotionInfo.type,
          abstract: shopPromotionInfo.abstract || '活动简介',
          shopName: targetShop.shopName || '汇邻优店',
          content: JSON.parse(shopPromotionInfo.promotionDetailInfo) || null,
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        })
      } else {
        res.render('shareError', {
          title: shopPromotionInfo.title || '优店活动',
          message: "店铺活动已经失效！",
          appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
        });
      }

    }).catch(next)
  } else {
    next(new Error('Failed to load ShopPromotion ' + req.params.id));
  }
});


module.exports = router;
