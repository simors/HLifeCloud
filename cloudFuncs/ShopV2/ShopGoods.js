/**
 * Created by yangyang on 2017/9/27.
 */
var Promise = require('bluebird')
var AV = require('leanengine')
var constructGoods = require('./shopTools').constructGoods

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

const goodsFunc = {
  fetchShopGoodsDetail,
}

module.exports = goodsFunc