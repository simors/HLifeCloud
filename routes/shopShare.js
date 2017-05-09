/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var GLOBAL_CONFIG = require('../config')


// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Shop = AV.Object.extend('Shop');

// 查询 Shop 详情
router.get('/:id', function(req, res, next) {
  var ShopId = req.params.id;

  if(ShopId) {
    var query = new AV.Query(Shop)

    query.get(ShopId).then((result) => {
      var shopInfo = result.attributes

      res.render('shopShare', {
        title: shopInfo.title || '汇邻优店',
        coverUrl: shopInfo.coverUrl || '',
        address: shopInfo.shopAddress || '未知地址',
        phone: shopInfo.contactNumber || '未知电话',
        openTime: shopInfo.openTime || '8:30-22:00',
        ourSpecial: shopInfo.ourSpecial || '没有特色就是最大的特色',
        appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
      })
    }).catch(next)
  } else {
    console.log("Failed to load Shop", req.params.id)
    next(new Error('Failed to load Shop ' + req.params.id));
  }
});


module.exports = router;
