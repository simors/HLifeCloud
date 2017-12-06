/**
 * Created by yangyang on 2017/9/27.
 */
var Promise = require('bluebird')
var AV = require('leanengine')
var constructGoods = require('./shopTools').constructGoods
var constructPromotion = require('./shopTools').constructPromotion

const CHINA_WIDTH = 5500.0      // 全国最大宽度


function getShopGoodsById(goodsId, includeShop, includePromotion) {
  let query = new AV.Query('ShopGoods')
  if (includeShop) {
    query.include(['targetShop', 'targetShop.owner', 'targetShop.targetShopCategory', 'targetShop.containedTag'])
  }
  if (includePromotion) {
    query.include('goodsPromotion')
  }
  return query.get(goodsId)
}

function fetchShopGoodsDetail(request, response) {
  let goodsId = request.params.goodsId
  getShopGoodsById(goodsId, true, true).then((goodsInfo) => {
    if (!goodsInfo) {
      response.error({errcode: 1, message: '找不到商品'})
      return
    }
    response.success({
      errcode: 0,
      goods: constructGoods(goodsInfo, true, true),
    })
  }).catch((err) => {
    console.log('error in get shop goods detail', err)
    response.error({errcode: 1, message: '找不到商品'})
  })
}

function fetchNearbyGoodPromotion(request, response) {
  var geo = request.params.geo
  var lastDistance = request.params.lastDistance
  var limit = request.params.limit || 20
  var nowDate = request.params.nowDate
  var query = new AV.Query('ShopGoodPromotion')
  query.equalTo('status', 1)
  query.include(['targetGood', 'targetShop'])
  query.limit(limit)

  var point = new AV.GeoPoint(geo)
  query.withinKilometers('geo', point, CHINA_WIDTH) // 全中国的最大距离

  if (lastDistance) {
    var notIncludeQuery = new AV.Query('ShopGoodPromotion')
    notIncludeQuery.equalTo('status', 1)
    notIncludeQuery.withinKilometers('geo', point, lastDistance)
    query.doesNotMatchKeyInQuery('objectId', 'objectId', notIncludeQuery)
  }
  query.greaterThanOrEqualTo('endDate', nowDate)
  query.find().then((results) => {
    var promotions = []
    results.forEach((promp) => {
      promotions.push(constructPromotion(promp, true, true))
    })
    response.success({errcode: 0, promotions: promotions})
  }, (err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取附近店铺促销信息失败'})
  }).catch((err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取附近店铺促销信息失败'})
  })
}

const goodsFunc = {
  fetchShopGoodsDetail,
  fetchNearbyGoodPromotion,
}

module.exports = goodsFunc