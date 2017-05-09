/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')


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
      res.render('shopPromotionShare', {
        title: shopPromotionInfo.title || '优店活动',
        coverUrl: shopPromotionInfo.coverUrl || '',
        type: shopPromotionInfo.type,
        abstract: shopPromotionInfo.abstract || '活动简介',
        shopName: targetShop.shopName || '汇邻优店',
        content: JSON.parse(shopPromotionInfo.promotionDetailInfo) || null,
        appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
      })
    }).catch(next)
  } else {
    next(new Error('Failed to load ShopPromotion ' + req.params.id));
  }
});


module.exports = router;
