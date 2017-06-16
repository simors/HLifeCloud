/**
 * Created by lilu on 2017/6/15.
 */

'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')


// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Good = AV.Object.extend('ShopGoods');

// 查询 Shop 详情
router.get('/:id', function(req, res, next) {
  var goodId = req.params.id;
  // console.log('id',goodId)
  if(goodId) {
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

    }).catch(next)
  } else {
    console.log("Failed to load Shop", req.params.id)
    next(new Error('Failed to load Shop ' + req.params.id));
  }
});


module.exports = router;
