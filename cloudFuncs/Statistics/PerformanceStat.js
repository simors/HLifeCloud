/**
 * Created by yangyang on 2017/4/21.
 */
var schedule = require('node-schedule')
var mysqlUtil = require('../util/mysqlUtil')
var Promise = require('bluebird')
var AV = require('leanengine')
var redis = require('redis')
var promoterFuncs = require('../Promoter')

// 收益来源分类
const INVITE_PROMOTER = 1       // 邀请推广员获得的收益
const INVITE_SHOP = 2           // 邀请店铺获得的收益

// 统计级别
const LEVEL_DISTRICT = 1
const LEVEL_CITY = 2
const LEVEL_PROVINCE = 3

var dailyJob = schedule.scheduleJob('0 0 12 * * *', function() {
  var date = new Date()
  date.setTime(date.getTime() - 24*60*60*1000)    // 统计昨天的业绩
  runDistrictPromoterStat(date.toLocaleDateString()).then((districtStat) => {
    return runCityPromoterStat(districtStat)
  }).then((cityStat) => {
    return runProvincePromoterStat(cityStat)
  }).catch((err) => {
    console.log(err)
  })
})

var monthJob = schedule.scheduleJob('0 0 7 1 * *', function() {
  console.log('exec statistic monthly')
})

/**
 * 执行统计数据保存，如果已经有相关统计数据则更新
 * @param data
 */
function execStatSave(data) {
  var query = new AV.Query('PromoterPerformanceStat')
  query.equalTo('province', data.province)
  query.equalTo('city', data.city)
  query.equalTo('district', data.district)
  query.equalTo('level', data.level)

  return query.first().then((stat) => {
    // 已经存在相关统计数据
    if (stat) {
      var newStat = AV.Object.createWithoutData('PromoterPerformanceStat', stat.id)
      newStat.set('shopNum', stat.shopNum)
      newStat.set('promoterNum', stat.promoterNum)
      newStat.set('earning', stat.earn)
      return newStat.save()
    } else {
      var PerformanceStat = AV.Object.extend('PromoterPerformanceStat')
      var performanceStat = new PerformanceStat()
      performanceStat.set('province', data.province)
      performanceStat.set('city', data.city)
      performanceStat.set('district', data.district)
      performanceStat.set('shopNum', data.shopNum)
      performanceStat.set('promoterNum', data.promoterNum)
      performanceStat.set('earning', data.earn)
      performanceStat.set('level', data.level)
      return performanceStat.save()
    }
  })
}

/**
 * 执行区县级推广统计
 * @param date
 */
function runDistrictPromoterStat(date) {
  var mysqlConn = undefined
  var sql = ''
  var originalRecords = []
  var shopNum = 0
  var promoterNum = 0
  var earning = 0

  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = 'SELECT * FROM `PromoterDeal` WHERE DATE_FORMAT(deal_time, \'%Y-%m-%d\') = DATE_FORMAT(?, \'%Y-%m-%d\')'
    return mysqlUtil.query(conn, sql, [date])
  }).then((queryRes) => {
    var ops = []
    queryRes.results.forEach((deal) => {
      var record = {
        from: deal.from,
        to: deal.to,
        promoterId: deal.promoterId,
        cost: deal.cost,
        dealTime: deal.deal_time,
        dealType: deal.deal_type,
      }
      if (INVITE_SHOP == deal.deal_type) {
        shopNum += 1
      } else if (INVITE_PROMOTER == deal.deal_type) {
        promoterNum += 1
      }
      ops.push(promoterFuncs.getPromoterById(deal.to, true))
      originalRecords.push(record)
    })
    // 提前释放mysql连接
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
    mysqlConn = undefined
    return Promise.all(ops)
  }).then((promoters) => {
    var statMap = new Map()
    var keyArray = []
    promoters.forEach((promoter, index) => {
      var areaKey = {
        province: promoter.attributes.liveProvince,
        city: promoter.attributes.liveCity,
        district: promoter.attributes.liveDistrict,
      }
      var key = keyArray.find((value) => {
        return (value.province == areaKey.province && value.city == areaKey.city && value.district == areaKey.district) ? true : false
      })
      var areaStat = undefined
      if (key) {
        areaStat = statMap.get(key)
      } else {
        areaStat = undefined
        key = areaKey
        keyArray.push(key)
      }
      if (!areaStat) {
        areaStat = {
          shopNum: 0,
          promoterNum: 0,
          earn: 0,
        }
        if (INVITE_SHOP == originalRecords[index].dealType) {
          areaStat.shopNum = 1
        } else if (INVITE_PROMOTER == originalRecords[index].dealType) {
          areaStat.promoterNum = 1
        }
        areaStat.earn = originalRecords[index].cost
      } else {
        if (INVITE_SHOP == originalRecords[index].dealType) {
          areaStat.shopNum += 1
        } else if (INVITE_PROMOTER == originalRecords[index].dealType) {
          areaStat.promoterNum += 1
        }
        areaStat.earn += originalRecords[index].cost
      }
      statMap.set(key, areaStat)
    })
    var saveOps = []
    statMap.forEach((stat, key) => {
      var statData = {
        province: key.province,
        city: key.city,
        district: key.district,
        shopNum: stat.shopNum,
        promoterNum: stat.promoterNum,
        earn: stat.earn,
        level: LEVEL_DISTRICT,
      }
      saveOps.push(execStatSave(statData))
    })
    return Promise.all(saveOps)
  }).catch((err) => {
    throw err
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
  })
}

/**
 * 执行城市推广员业绩统计
 * @param districtStat
 */
function runCityPromoterStat(districtStat) {
  var statMap = new Map()
  var keyArray = []
  districtStat.forEach((stat) => {
    var areaKey = {
      province: stat.attributes.province,
      city: stat.attributes.city,
    }
    var key = keyArray.find((value) => {
      return (value.province == areaKey.province && value.city == areaKey.city) ? true : false
    })
    var areaStat = undefined
    if (key) {
      areaStat = statMap.get(key)
    } else {
      areaStat = undefined
      key = areaKey
      keyArray.push(key)
    }
    if (!areaStat) {
      areaStat = {
        shopNum: 0,
        promoterNum: 0,
        earn: 0,
      }
      areaStat.shopNum = stat.attributes.shopNum
      areaStat.promoterNum = stat.attributes.promoterNum
      areaStat.earn = stat.attributes.earning
    } else {
      areaStat.shopNum += stat.attributes.shopNum
      areaStat.promoterNum += stat.attributes.promoterNum
      areaStat.earn += stat.attributes.earning
    }
    statMap.set(key, areaStat)
  })

  var saveOps = []
  statMap.forEach((stat, key) => {
    var statData = {
      province: key.province,
      city: key.city,
      shopNum: stat.shopNum,
      promoterNum: stat.promoterNum,
      earn: stat.earn,
      level: LEVEL_CITY,
    }
    saveOps.push(execStatSave(statData))
  })
  return Promise.all(saveOps)
}

/**
 * 执行省份推广业绩统计
 * @param cityStat
 * @returns {Promise.<*>}
 */
function runProvincePromoterStat(cityStat) {
  var statMap = new Map()
  var keyArray = []
  cityStat.forEach((stat) => {
    var areaKey = {
      province: stat.attributes.province,
    }
    var key = keyArray.find((value) => {
      return (value.province == areaKey.province) ? true : false
    })
    var areaStat = undefined
    if (key) {
      areaStat = statMap.get(key)
    } else {
      areaStat = undefined
      key = areaKey
      keyArray.push(key)
    }
    if (!areaStat) {
      areaStat = {
        shopNum: 0,
        promoterNum: 0,
        earn: 0,
      }
      areaStat.shopNum = stat.attributes.shopNum
      areaStat.promoterNum = stat.attributes.promoterNum
      areaStat.earn = stat.attributes.earning
    } else {
      areaStat.shopNum += stat.attributes.shopNum
      areaStat.promoterNum += stat.attributes.promoterNum
      areaStat.earn += stat.attributes.earning
    }
    statMap.set(key, areaStat)
  })

  var saveOps = []
  statMap.forEach((stat, key) => {
    var statData = {
      province: key.province,
      shopNum: stat.shopNum,
      promoterNum: stat.promoterNum,
      earn: stat.earn,
      level: LEVEL_PROVINCE,
    }
    saveOps.push(execStatSave(statData))
  })
  return Promise.all(saveOps)
}

/**
 * 执行推广统计
 * @param request
 * @param response
 */
function statPromoterPerformance(request, response) {
  var date = request.params.date
  if (!date) {
    date = new Date().toLocaleDateString()
  }
  runDistrictPromoterStat(date).then((districtStat) => {
    return runCityPromoterStat(districtStat)
  }).then((cityStat) => {
    return runProvincePromoterStat(cityStat)
  }).then(() => {
    response.success({errcode: 0, message: '执行推广员日统计功能成功'})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '执行推广员日统计功能失败'})
  })
}

var StatFuncs = {
  statPromoterPerformance: statPromoterPerformance,
}

module.exports = StatFuncs