/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var ShopPromotion = AV.Object.extend('ShopPromotion');

// 查询 ShopPromotion 详情
router.get('/:id', function(req, res, next) {
  console.log("ShopPromotion id:", req.params.id)
  var shopPromotionId = req.params.id;

  if(shopPromotionId) {
    var query = new AV.Query(ShopPromotion)

    query.get(shopPromotionId).then((result) => {
      console.log("ShopPromotion result:", result)
      var shopPromotionInfo = result.attributes
      res.render('shopPromotionShare', {
        title: shopPromotionInfo.title || '优店活动',
        coverUrl: shopPromotionInfo.coverUrl || '',
        content: JSON.parse(shopPromotionInfo.promotionDetailInfo) || null,
      })
    }).catch(next)
  } else {
    next(new Error('Failed to load ShopPromotion ' + req.params.id));
  }
});


module.exports = router;
