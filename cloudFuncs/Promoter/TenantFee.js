/**
 * Created by yangyang on 2017/4/8.
 */
var AV = require('leanengine')
var Promise = require('bluebird')

/**
 * 获取店铺入驻费用列表
 * @param request
 * @param response
 */
function fetchShopTenantFee(request, response) {
  var province = request.params.province
  var city = request.params.city
  var orderType = request.params.orderType
  var descend = request.params.descend
  var limit = request.params.limit

  if (!limit) {
    limit = 10
  }

  if (!descend) {
    descend = false
  } else {
    if ('descend' == descend) {
      descend = true
    } else {
      descend = false
    }
  }

  if (!orderType) {
    orderType = 'provinceOrder'
  }

  var query = new AV.Query('PromoterShopTenantFee')

  if (province) {
    query.equalTo('province', province)
  }
  if (city) {
    query.equalTo('city', city)
  }

  if (descend) {
    if (orderType == 'cityOrder') {
      query.descending('city')
    } else if (orderType == 'feeOrder') {
      query.descending('fee')
    } else {
      query.descending('province')
    }
  } else {
    if (orderType == 'cityOrder') {
      query.ascending('city')
    } else if (orderType == 'feeOrder') {
      query.ascending('fee')
    } else {
      query.ascending('province')
    }
  }

  query.limit(limit)
  query.find().then((tenants) => {
    response.success({errcode: 0, message: '获取店铺入驻费列表成功', tenantFee: tenants})
  }).catch((err) => {
    response.error({errcode: 1, message: '获取店铺入驻费列表失败'})
  })
}

var tenantFee = {
  fetchShopTenantFee: fetchShopTenantFee,
}

module.exports = tenantFee