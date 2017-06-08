/**
 * Created by yangyang on 2017/6/6.
 */
var Promise = require('bluebird')
var AV = require('leanengine')

function addNewShopGoods(request, response) {
  var shopId = request.params.shopId
  var goodsName = request.params.goodsName
  var price = request.params.price
  var originalPrice = request.params.originalPrice
  var coverPhoto = request.params.coverPhoto
  var album = request.params.album
  var detail = request.params.detail

  var targetShop = AV.Object.createWithoutData('Shop', shopId)

  var ShopGoods = AV.Object.extend('ShopGoods')
  var shopGoods = new ShopGoods()
  shopGoods.set('targetShop', targetShop)
  shopGoods.set('goodsName', goodsName)
  shopGoods.set('price', price)
  shopGoods.set('originalPrice', originalPrice)
  shopGoods.set('coverPhoto', coverPhoto)
  shopGoods.set('album', album)
  shopGoods.set('detail', detail)
  shopGoods.set('status', 1)

  shopGoods.save(null, {fetchWhenSave: true}).then((goodsInfo) => {
    response.success({errcode: 0, goodsInfo: goodsInfo})
  }, (err) => {
    console.log('err in addNewShopGoods:', err)
    response.error({errcode: 1, message: '增加商品失败'})
  }).catch((err) => {
    console.log('err in addNewShopGoods:', err)
    response.error({errcode: 1, message: '增加商品失败'})
  })
}

function modifyShopGoodsInfo(request, response) {
  var goodsId = request.params.goodsId
  var goodsName = request.params.goodsName
  var price = request.params.price
  var originalPrice = request.params.originalPrice
  var coverPhoto = request.params.coverPhoto
  var album = request.params.album
  var detail = request.params.detail

  var shopGoods = AV.Object.createWithoutData('ShopGoods', goodsId)
  shopGoods.set('goodsName', goodsName)
  shopGoods.set('price', price)
  shopGoods.set('originalPrice', originalPrice)
  shopGoods.set('coverPhoto', coverPhoto)
  shopGoods.set('album', album)
  shopGoods.set('detail', detail)
  shopGoods.save(null, {fetchWhenSave: true}).then((goodsInfo) => {
    response.success({errcode: 0, goodsInfo: goodsInfo})
  }, (err) => {
    console.log('err in shopGoodsOffline:', err)
    response.error({errcode: 1, message: '修改商品信息失败'})
  }).catch((err) => {
    console.log('err in shopGoodsOffline:', err)
    response.error({errcode: 1, message: '修改商品信息失败'})
  })
}

function shopGoodsOnline(request, response) {
  var goodsId = request.params.goodsId
  var shopGoods = AV.Object.createWithoutData('ShopGoods', goodsId)
  shopGoods.set('status', 1)
  shopGoods.save(null, {fetchWhenSave: true}).then((goodsInfo) => {
    response.success({errcode: 0, goodsInfo: goodsInfo})
  }, (err) => {
    console.log('err in shopGoodsOnline:', err)
    response.error({errcode: 1, message: '商品上架失败'})
  }).catch((err) => {
    console.log('err in shopGoodsOnline:', err)
    response.error({errcode: 1, message: '商品上架失败'})
  })
}

function shopGoodsOffline(request, response) {
  var goodsId = request.params.goodsId
  var shopGoods = AV.Object.createWithoutData('ShopGoods', goodsId)
  shopGoods.set('status', 2)
  shopGoods.save(null, {fetchWhenSave: true}).then((goodsInfo) => {
    response.success({errcode: 0, goodsInfo: goodsInfo})
  }, (err) => {
    console.log('err in shopGoodsOffline:', err)
    response.error({errcode: 1, message: '商品下架失败'})
  }).catch((err) => {
    console.log('err in shopGoodsOffline:', err)
    response.error({errcode: 1, message: '商品下架失败'})
  })
}

function shopGoodsDelete(request, response) {
  var goodsId = request.params.goodsId
  var shopGoods = AV.Object.createWithoutData('ShopGoods', goodsId)
  shopGoods.set('status', 3)
  shopGoods.save(null, {fetchWhenSave: true}).then((goodsInfo) => {
    response.success({errcode: 0, goodsInfo: goodsInfo})
  }, (err) => {
    console.log('err in shopGoodsDelete:', err)
    response.error({errcode: 1, message: '商品删除失败'})
  }).catch((err) => {
    console.log('err in shopGoodsDelete:', err)
    response.error({errcode: 1, message: '商品删除失败'})
  })
}

function fetchShopGoods(request, response) {
  var shopId = request.params.shopId
  var status = request.params.status
  var limit = request.params.limit || 20
  var lastUpdateTime = request.params.lastUpdateTime

  var query = new AV.Query('ShopGoods')
  var targetShop = AV.Object.createWithoutData('Shop', shopId)
  query.equalTo('targetShop', targetShop)
  query.equalTo('status', status)
  if (lastUpdateTime) {
    query.lessThan('updatedAt', new Date(lastUpdateTime))
  }
  query.descending('updatedAt')
  query.limit(limit)

  query.find().then((goods) => {
    response.success({errcode: 0, goods: goods})
  }, (err) => {
    console.log('err in fetchShopGoods:', err)
    response.error({errcode: 1, goods: [], message: '获取商品列表失败'})
  }).catch((err) => {
    console.log('err in fetchShopGoods:', err)
    response.error({errcode: 1, goods: [], message: '获取商品列表失败'})
  })
}

var GoodsFunc = {
  addNewShopGoods: addNewShopGoods,
  modifyShopGoodsInfo: modifyShopGoodsInfo,
  shopGoodsOnline: shopGoodsOnline,
  shopGoodsOffline: shopGoodsOffline,
  shopGoodsDelete: shopGoodsDelete,
  fetchShopGoods: fetchShopGoods,
}

module.exports = GoodsFunc