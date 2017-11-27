/**
 * Created by yangyang on 2017/8/15.
 */
var AV = require('leanengine');
var redis = require('redis');
var Promise = require('bluebird');

const ORDER_STATUS = {
  PAID_FINISHED: 1, // 已支付
  DELIVER_GOODS: 2, // 已发货
  ACCOMPLISH: 3,    // 已完成
  DELETED: 4,       // 已删除
}

function constructShopOrder(order,includeUser,includeShop,includeShopGoods) {
  var constructUserInfo = require('../Auth').constructUserInfo
  var constructShopInfo = require('../ShopV2/shopTools').constructShop
  var constructShopGoods = require('../ShopV2/shopTools').constructGoods
  var shopOrder = {}
  var orderAttr = order.attributes
  shopOrder.id = order.id
  shopOrder.receiver = orderAttr.receiver
  shopOrder.receiverPhone = orderAttr.receiverPhone
  shopOrder.receiverAddr = orderAttr.receiverAddr
  shopOrder.goodsAmount = orderAttr.goodsAmount
  shopOrder.paid = orderAttr.paid
  shopOrder.orderStatus = orderAttr.orderStatus
  shopOrder.remark = orderAttr.remark
  shopOrder.createdAt = order.createdAt
  shopOrder.updatedAt = order.updatedAt
  shopOrder.buyerId = orderAttr.buyer.id
  shopOrder.vendorId = orderAttr.vendor.id
  shopOrder.goodsId = orderAttr.goods.id
  if(orderAttr.buyer&&includeUser){
    shopOrder.buyer = constructUserInfo(orderAttr.buyer)
  }
  if(orderAttr.buyer&&includeShop) {
    shopOrder.vendor = constructShopInfo(orderAttr.vendor,false,false)
  }
  if(orderAttr.buyer&&includeShopGoods) {
    shopOrder.goods = constructShopGoods(orderAttr.goods,false,false)
  }
  return shopOrder
}

/**
 * 新建订单
 * @param order
 * @returns {Promise.<Conversation>|*|Promise<Conversation>}
 */
function createShopOrder(order) {
  var ShopOrders = AV.Object.extend('ShopOrders')
  var shopOrder = new ShopOrders()

  var buyer = AV.Object.createWithoutData('_User', order.buyerId)
  var vendor = AV.Object.createWithoutData('Shop', order.vendorId)
  var goods = AV.Object.createWithoutData('ShopGoods', order.goodsId)

  shopOrder.set('buyer', buyer)
  shopOrder.set('vendor', vendor)
  shopOrder.set('goods', goods)
  shopOrder.set('receiver', order.receiver)
  shopOrder.set('receiverPhone', order.receiverPhone)
  shopOrder.set('receiverAddr', order.receiverAddr)
  shopOrder.set('goodsAmount', order.goodsAmount)
  shopOrder.set('paid', order.paid)
  shopOrder.set('orderStatus', ORDER_STATUS.PAID_FINISHED)
  shopOrder.set('remark', order.remark)
  return shopOrder.save()
}

/**
 * 处理新建订单请求
 * @param request
 * @param response
 */
function handleNewShopOrderReq(request, response) {
  var order = {
    buyerId: request.params.buyerId,
    vendorId: request.params.vendorId,
    goodsId: request.params.goodsId,
    receiver: request.params.receiver,
    receiverPhone: request.params.receiverPhone,
    receiverAddr: request.params.receiverAddr,
    goodsAmount: request.params.goodsAmount,
    paid: request.params.paid,
    remark: request.params.remark,
  }
  createShopOrder(order).then((shopOrder) => {
    response.success({
      errcode: 0,
      message: '创建订单成功',
      shopOrder: shopOrder,
    })
  }, (err) => {
    console.log('err in handleNewShopOrderReq', err)
    response.error({
      errcode: 1,
      message: '创建订单失败',
    })
  }).catch((err) => {
    console.log('err in handleNewShopOrderReq', err)
    response.error({
      errcode: 1,
      message: '创建订单失败',
    })
  })
}

/**
 * 设置订单状态
 * @param request
 * @param response
 */
function modifyOrderStatus(request, response) {
  var orderId = request.params.orderId
  var orderStatus = request.params.orderStatus

  var shopOrder = AV.Object.createWithoutData('ShopOrders', orderId)
  shopOrder.set('orderStatus', orderStatus)
  shopOrder.save().then(() => {
    response.success({
      errcode: 0,
      message: '订单状态修改成功',
    })
  }, (err) => {
    console.log('err in modifyOrderStatus', err)
    response.error({
      errcode: 1,
      message: '订单状态修改失败',
    })
  }).catch((err) => {
    console.log('err in modifyOrderStatus', err)
    response.error({
      errcode: 1,
      message: '订单状态修改失败',
    })
  })
}

/**
 * 查询订单信息，支持分页
 * @param request
 * @param response
 */
function queryShopOrders(request, response) {
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
      shopOrders.push(constructShopOrder(order,true,true,true))
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
  handleNewShopOrderReq: handleNewShopOrderReq,
  createShopOrder: createShopOrder,
  modifyOrderStatus: modifyOrderStatus,
  queryShopOrders: queryShopOrders,
}

module.exports = ShopOrdersFunc