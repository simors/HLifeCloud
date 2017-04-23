/**
 * Created by yangyang on 2017/4/21.
 */
var schedule = require('node-schedule')
var mysqlUtil = require('../util/mysqlUtil')
var Promise = require('bluebird')
var AV = require('leanengine')
var redis = require('redis')
var dateFormat = require('dateformat')
var promoterFuncs = require('../Promoter')

// 收益来源分类
const INVITE_PROMOTER = 1       // 邀请推广员获得的收益
const INVITE_SHOP = 2           // 邀请店铺获得的收益

// 统计级别
const LEVEL_DISTRICT = 1
const LEVEL_CITY = 2
const LEVEL_PROVINCE = 3

const ONE_DAY = 24*60*60*1000

var dailyJob = schedule.scheduleJob('0 0 12 * * *', function() {
  var date = new Date()
  date.setTime(date.getTime() - ONE_DAY)    // 统计昨天的业绩
  runDistrictPromoterStat(date.toLocaleDateString()).then((districtStat) => {
    return runCityPromoterStat(districtStat)
  }).then((cityStat) => {
    return runProvincePromoterStat(cityStat)
  }).catch((err) => {
    console.log(err)
  })
})

var monthJob = schedule.scheduleJob('0 0 7 1 * *', function() {
  var date = new Date()
  var year = date.getFullYear()
  var month = date.getMonth()
  if (month == 0) {
    month = 12
    year = year - 1
  }
  runDistrictMonthStat(year, month).then((districtStat) => {
    return runCityMonthStat(districtStat)
  }).then((cityStat) => {
    return runProvinceMonthStat(cityStat)
  }).catch((err) => {
    console.log(err)
  })
})

/**
 * 执行日统计数据保存，如果已经有相关统计数据则更新
 * @param data
 */
function execDailyStatSave(data) {
  var query = new AV.Query('PromoterPerformanceStat')
  query.equalTo('province', data.province)
  if (data.city) {
    query.equalTo('city', data.city)
  }
  if (data.district) {
    query.equalTo('district', data.district)
  }
  query.equalTo('level', data.level)
  query.equalTo('statDate', new Date(data.statDate))

  return query.first().then((stat) => {
    // 已经存在相关统计数据
    if (stat) {
      var newStat = AV.Object.createWithoutData('PromoterPerformanceStat', stat.id)
      newStat.set('shopNum', data.shopNum)
      newStat.set('promoterNum', data.promoterNum)
      newStat.set('earning', data.earn)
      return newStat.save().then((stat) => {
        return stat.fetch()
      })
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
      performanceStat.set('statDate', new Date(data.statDate))
      return performanceStat.save()
    }
  })
}

/**
 * 执行月统计数据保存，如果已经存在则更新
 * @param data
 * @returns {*|Promise.<TResult>}
 */
function execMonthlyStatSave(data) {
  var query = new AV.Query('PromoterMonthStat')
  query.equalTo('province', data.province)
  if (data.city) {
    query.equalTo('city', data.city)
  }
  if (data.district) {
    query.equalTo('district', data.district)
  }
  query.equalTo('level', data.level)
  query.equalTo('year', data.year)
  query.equalTo('month', data.month)

  return query.first().then((stat) => {
    // 已经存在相关统计数据
    if (stat) {
      var newStat = AV.Object.createWithoutData('PromoterMonthStat', stat.id)
      newStat.set('shopNum', data.shopNum)
      newStat.set('promoterNum', data.promoterNum)
      newStat.set('earning', data.earn)
      return newStat.save().then((stat) => {
        return stat.fetch()
      })
    } else {
      var PerformanceStat = AV.Object.extend('PromoterMonthStat')
      var performanceStat = new PerformanceStat()
      performanceStat.set('province', data.province)
      performanceStat.set('city', data.city)
      performanceStat.set('district', data.district)
      performanceStat.set('shopNum', data.shopNum)
      performanceStat.set('promoterNum', data.promoterNum)
      performanceStat.set('earning', data.earn)
      performanceStat.set('level', data.level)
      performanceStat.set('year', data.year)
      performanceStat.set('month', data.month)
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
        statDate: date,
      }
      saveOps.push(execDailyStatSave(statData))
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
      areaStat.statDate = stat.attributes.statDate
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
      statDate: stat.statDate,
    }
    saveOps.push(execDailyStatSave(statData))
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
      areaStat.statDate = stat.attributes.statDate
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
      statDate: stat.statDate,
    }
    saveOps.push(execDailyStatSave(statData))
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

/**
 * 获取某日的业绩统计数据
 * @param request
 * @param response
 */
function fetchDaliyPerformance(request, response) {
  var level = request.params.level
  var province = request.params.province
  var city = request.params.city
  var district = request.params.district
  var date = new Date(dateFormat(request.params.date, 'isoDateTime'))

  var query = new AV.Query('PromoterPerformanceStat')
  query.equalTo('level', level)
  query.equalTo('statDate', new Date(date))

  switch (level) {
    case 1:
      query.equalTo('province', province)
      query.equalTo('city', city)
      query.equalTo('district', district)
      break
    case 2:
      query.equalTo('province', province)
      query.equalTo('city', city)
      break
    case 3:
      query.equalTo('province', province)
      break
  }

  query.first().then((stat) => {
    response.success({errcode: 0, statistics: stat})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取统计数据失败'})
  })
}

/**
 *
 * @param request
 * @param response
 */
function fetchLastDaysPerformance(request, response) {
  var level = request.params.level
  var province = request.params.province
  var city = request.params.city
  var district = request.params.district
  var lastDate = new Date(dateFormat(request.params.lastDate, 'isoDate'))
  var days = request.params.days

  var beginQuery = new AV.Query('PromoterPerformanceStat')
  beginQuery.greaterThanOrEqualTo('statDate', new Date(lastDate.getTime() - days * ONE_DAY))

  var endQuery = new AV.Query('PromoterPerformanceStat')
  endQuery.lessThan('statDate', lastDate)

  var query = AV.Query.and(beginQuery, endQuery)
  query.equalTo('level', level)
  query.ascending('statDate')

  switch (level) {
    case 1:
      query.equalTo('province', province)
      query.equalTo('city', city)
      query.equalTo('district', district)
      break
    case 2:
      query.equalTo('province', province)
      query.equalTo('city', city)
      break
    case 3:
      query.equalTo('province', province)
      break
  }

  query.find().then((stat) => {
    response.success({errcode: 0, statistics: stat})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取统计数据失败'})
  })
}

/**
 * 执行月度区县级业绩统计
 * @param year
 * @param month
 */
function runDistrictMonthStat(year, month) {
  var beginDate = new Date()
  beginDate.setFullYear(year, month-1, 0)
  var endDate = new Date()
  endDate.setFullYear(year, month-1, beginDate.getDate())

  var beginQuery = new AV.Query('PromoterPerformanceStat')
  beginQuery.greaterThan('statDate', beginDate)

  var endQuery = new AV.Query('PromoterPerformanceStat')
  endQuery.lessThan('statDate', endDate)

  var query = AV.Query.and(beginQuery, endQuery)
  query.equalTo('level', LEVEL_DISTRICT)

  return query.find().then((statList) => {
    var statMap = new Map()
    var keyArray = []
    statList.forEach((stat, index) => {
      var areaKey = {
        province: stat.attributes.province,
        city: stat.attributes.city,
        district: stat.attributes.district,
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
        district: key.district,
        shopNum: stat.shopNum,
        promoterNum: stat.promoterNum,
        earn: stat.earn,
        level: LEVEL_DISTRICT,
        year: year,
        month: month,
      }
      saveOps.push(execMonthlyStatSave(statData))
    })
    return Promise.all(saveOps)
  })
}

/**
 * 执行城市月度统计
 * @param districtStat
 * @returns {Promise.<*>}
 */
function runCityMonthStat(districtStat) {
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
      areaStat.year = stat.attributes.year
      areaStat.month = stat.attributes.month
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
      year: stat.year,
      month: stat.month,
    }
    saveOps.push(execMonthlyStatSave(statData))
  })
  return Promise.all(saveOps)
}

/**
 * 执行身份月度统计
 * @param districtStat
 * @returns {Promise.<*>}
 */
function runProvinceMonthStat(cityStat) {
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
      areaStat.year = stat.attributes.year
      areaStat.month = stat.attributes.month
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
      year: stat.year,
      month: stat.month,
    }
    saveOps.push(execMonthlyStatSave(statData))
  })
  return Promise.all(saveOps)
}

/**
 * 统计
 * @param request
 * @param response
 */
function statMonthPerformance(request, response) {
  var year = request.params.year
  var month = request.params.month

  runDistrictMonthStat(year, month).then((districtStat) => {
    return runCityMonthStat(districtStat)
  }).then((cityStat) => {
    return runProvinceMonthStat(cityStat)
  }).then(() => {
    response.success({errcode: 0, message: '执行推广员月统计功能成功'})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '执行推广员月统计功能失败'})
  })
}

/**
 *
 * @param request
 * @param response
 */
function fetchMonthPerformance(request, response) {
  var level = request.params.level
  var province = request.params.province
  var city = request.params.city
  var district = request.params.district
  var year = request.params.year
  var month = request.params.month

  var query = new AV.Query('PromoterMonthStat')
  query.equalTo('level', level)
  query.equalTo('year', year)
  query.equalTo('month', month)

  switch (level) {
    case 1:
      query.equalTo('province', province)
      query.equalTo('city', city)
      query.equalTo('district', district)
      break
    case 2:
      query.equalTo('province', province)
      query.equalTo('city', city)
      break
    case 3:
      query.equalTo('province', province)
      break
  }

  query.first().then((stat) => {
    response.success({errcode: 0, statistics: stat})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取统计数据失败'})
  })
}

var StatFuncs = {
  statPromoterPerformance: statPromoterPerformance,
  fetchDaliyPerformance: fetchDaliyPerformance,
  fetchLastDaysPerformance: fetchLastDaysPerformance,
  statMonthPerformance: statMonthPerformance,
  fetchMonthPerformance: fetchMonthPerformance,
}

module.exports = StatFuncs