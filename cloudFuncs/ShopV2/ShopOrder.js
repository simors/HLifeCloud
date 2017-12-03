/**
 * Created by lilu on 2017/11/28.
 */
/**
 * Created by yangyang on 2017/8/15.
 */
var AV = require('leanengine');
var redis = require('redis');
var Promise = require('bluebird');
var constructShopOrder = require('./shopTools').constructShopOrder

const ORDER_STATUS = {
  PAID_FINISHED: 1, // 已支付
  DELIVER_GOODS: 2, // 已发货
  ACCOMPLISH: 3,    // 已完成
  DELETED: 4,       // 已删除
}

/**
 * 查询订单信息，支持分页
 * @param request
 * @param response
 */
function queryShopOrders(request, response) {
  let {currentUser} = request
  if(!currentUser){
    response.error('don t login')
  }
  var buyerId = request.params.buyerId
  var vendorId = request.params.vendorId
  var orderStatus = request.params.orderStatus
  var lastTime = request.params.lastTime
  var limit = request.params.limit || 10

  var query = new AV.Query('ShopOrders')
  if (buyerId) {
    var buyer = AV.Object.createWithoutData('_User', buyerId)
    query.equalTo('buyer', buyer)
  }
  if (vendorId) {
    var vendor = AV.Object.createWithoutData('Shop', vendorId)
    query.equalTo('vendor', vendor)
  }
  if (orderStatus) {
    query.containedIn('orderStatus', orderStatus)
  }
  if (lastTime) {
    query.lessThan('createdAt', new Date(lastTime))
  }
  query.descending('createdAt')
  query.limit(limit)
  query.include(['buyer', 'vendor', 'goods'])

  query.find().then((results) => {
    var shopOrders = []
    results.forEach((order) => {
      shopOrders.push(constructShopOrder(order, true, true, true))
    })
    response.success({
      errcode: 0,
      shopOrders: shopOrders
    })
  }, (err) => {
    console.log('error in queryShopOrders', err)
    response.error({
      errcode: 1,
      message: '查询订单出错',
    })
  }).catch((err) => {
    console.log('error in queryShopOrders', err)
    response.error({
      errcode: 1,
      message: '查询订单出错',
    })
  })
}

var ShopOrdersFunc = {
  ORDER_STATUS: ORDER_STATUS,
  queryShopOrders: queryShopOrders,
}

module.exports = ShopOrdersFunc