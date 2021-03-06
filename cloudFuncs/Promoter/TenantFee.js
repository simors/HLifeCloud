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

/**
 *
 * @param province
 * @param city
 * @returns {*}
 */
function shopTenantByCity(province, city) {
  var getPromoterConfig = require('./index').getPromoterConfig

  var query = new AV.Query('PromoterShopTenantFee')
  query.equalTo('province', province)
  query.equalTo('city', city)

  return query.first().then((tenant) => {
    if (!tenant) {
      return getPromoterConfig().then((syscfg) => {
        return syscfg.minShopkeeperCharge
      })
    } else {
      return new Promise((resolve) => {
        resolve(tenant.attributes.fee)
      })
    }
  })
}

/**
 * 根据城市名获取店铺入驻费
 * @param request
 * @param response
 */
function getShopTenantByCity(request, response) {
  var province = request.params.province
  var city = request.params.city

  shopTenantByCity(province, city).then((tenant) => {
    response.success({errcode: 0, tenant: tenant})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取店铺入驻费失败'})
  })
}

/**
 * 设置某地的店铺入驻费
 * @param request
 * @param response
 */
function setShopTenantFee(request, response) {
  var province = request.params.province
  var city = request.params.city
  var fee = request.params.fee
  var getPromoterConfig = require('./index').getPromoterConfig

  var query = new AV.Query('PromoterShopTenantFee')
  query.equalTo('province', province)
  query.equalTo('city', city)

  getPromoterConfig().then((syscfg) => {
    var minFee = syscfg.minShopkeeperCharge
    if (fee < minFee) {
      response.error({errcode: 1, message: '设置的入驻费不得小于平台设定的最低费用'})
    }
    return query.first()
  }).then((tenant) => {
    if (!tenant) {
      var PromoterShopTenantFee = AV.Object.extend('PromoterShopTenantFee')
      var tenantFee = new PromoterShopTenantFee()
      tenantFee.set('province', province)
      tenantFee.set('city', city)
      tenantFee.set('fee', fee)
      return tenantFee.save()
    } else {
      var newTenant = AV.Object.createWithoutData('PromoterShopTenantFee', tenant.id)
      newTenant.set('fee', fee)
      return newTenant.save()
    }
  }).then((newTenant) => {
    response.success({errcode: 0, tenant: newTenant})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取店铺入驻费失败'})
  })
}

var tenantFee = {
  shopTenantByCity: shopTenantByCity,
  fetchShopTenantFee: fetchShopTenantFee,
  getShopTenantByCity: getShopTenantByCity,
  setShopTenantFee: setShopTenantFee,
}

module.exports = tenantFee