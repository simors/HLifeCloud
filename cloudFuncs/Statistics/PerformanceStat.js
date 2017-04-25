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
var getSubAreaByAreaName = require('../baidu').getSubAreaByAreaName

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
    var retStat = []
    for (var i = days-1; i >= 0; i--) {
      var curDate = new Date(lastDate.getTime() - i * ONE_DAY)
      var curStat = stat.find((statValue) => {
        return curDate.toDateString() == (new Date(statValue.attributes.statDate)).toDateString() ? true : false
      })
      if (curStat) {
        var obj = {
          level: curStat.attributes.level,
          province: curStat.attributes.province,
          city: curStat.attributes.city,
          district: curStat.attributes.district,
          earning: curStat.attributes.earning,
          shopNum: curStat.attributes.shopNum,
          promoterNum: curStat.attributes.promoterNum,
          statDate: (new Date(curStat.attributes.statDate)).toLocaleDateString(),
        }
        retStat.push(obj)
      } else {
        var obj = {
          level: level,
          province: province,
          city: city,
          district: district,
          earning: 0,
          shopNum: 0,
          promoterNum: 0,
          statDate: curDate.toLocaleDateString(),
        }
        retStat.push(obj)
      }
    }
    response.success({errcode: 0, statistics: retStat})
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
 * 获取某地区月度业绩
 * @param payload
 * @returns {*}
 */
function getAreaMonthPerformance(payload) {
  var query = new AV.Query('PromoterMonthStat')
  query.equalTo('level', payload.level)
  query.equalTo('year', payload.year)
  query.equalTo('month', payload.month)

  switch (payload.level) {
    case LEVEL_DISTRICT:
      query.equalTo('province', payload.province)
      query.equalTo('city', payload.city)
      query.equalTo('district', payload.district)
      break
    case LEVEL_CITY:
      query.equalTo('province', payload.province)
      query.equalTo('city', payload.city)
      break
    case LEVEL_PROVINCE:
      query.equalTo('province', payload.province)
      break
  }

  return query.first()
}

/**
 *
 * @param request
 * @param response
 */
function fetchMonthPerformance(request, response) {
  var payload = {
    level: request.params.level,
    province: request.params.province,
    city: request.params.city,
    district: request.params.district,
    year: request.params.year,
    month: request.params.month,
  }

  getAreaMonthPerformance(payload).then((stat) => {
    response.success({errcode: 0, statistics: stat})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取统计数据失败'})
  })
}

/**
 * 获取下辖地区月度统计数据
 * @param payload
 * @returns {Promise.<TResult>}
 */
function getSubAreaMonthPerformance(payload) {
  var level = payload.level
  var province = payload.province
  var city = payload.city
  var year = payload.year
  var month = payload.month
  var area = ''
  var areaType = ''

  if (LEVEL_PROVINCE == level) {
    area = province
    areaType = 'province'
  } else if (LEVEL_CITY == level) {
    area = city
    areaType = 'city'
  } else {
    throw new Error('不支持的地区级别')
  }

  return getSubAreaByAreaName(area, areaType).then((subAreas) => {
    var newLevel = level - 1
    var ops = []
    subAreas.forEach((subArea) => {
      var subpayload = {
        level: newLevel,
        province: province,
        city: LEVEL_CITY == newLevel ? subArea.area_name : city,
        district: LEVEL_CITY == newLevel ? undefined : subArea.area_name,
        year: year,
        month: month,
      }
      ops.push(getAreaMonthPerformance(subpayload))
    })
    return Promise.all(ops)
  })
}

/**
 * 获取某地下辖地区的月度业绩统计数据，由于区县是地区分级的最下级，
 * 所以此接口不支持查询区县级下辖地区的月度业绩
 * @param request
 * @param response
 */
function fetchAreaMonthPerformance(request, response) {
  var payload = {
    level: request.params.level,
    province: request.params.province,
    city: request.params.city,
    year: request.params.year,
    month: request.params.month
  }

  getSubAreaMonthPerformance(payload).then((stat) => {
    response.success({errcode: 0, statistics: stat})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取统计数据失败'})
  })
}

/**
 *
 * @param payload
 * @returns {Promise.<Conversation[]>|*|T|Promise<Array<Conversation>>}
 */
function getAreaLastMonthPerformance(payload) {
  var level = payload.level
  var province = payload.province
  var city = payload.city
  var district = payload.district
  var lastYear = payload.lastYear
  var lastMonth = payload.lastMonth
  var months = payload.months

  var beginYear = lastYear
  var beginMonth = lastMonth
  if (lastMonth - months < 0) {
    beginYear = beginYear - 1
    beginMonth = 12 - (months - lastMonth) + 1
  } else {
    beginMonth = lastMonth - months
  }

  var beginQuery = new AV.Query('PromoterMonthStat')
  beginQuery.equalTo('year', beginYear)   // 只获取这一年的数据
  beginQuery.greaterThanOrEqualTo('month', beginMonth)

  var endQuery = new AV.Query('PromoterMonthStat')
  endQuery.equalTo('year', lastYear)    // 只获取这一年的数据
  endQuery.lessThanOrEqualTo('month', lastMonth)

  // 由于每次只获取那一年的数据，为了将所有数据拼起来，所以用or
  var query = AV.Query.or(beginQuery, endQuery)
  query.equalTo('level', level)
  query.addAscending('year')
  query.addAscending('month')

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

  return query.find()
}

/**
 * 获取过去几个月的月统计数据，不大于12个月
 * @param request
 * @param response
 */
function fetchLastMonthsPerformance(request, response) {
  var payload = {
    level: request.params.level,
    province: request.params.province,
    city: request.params.city,
    district: request.params.district,
    lastYear: request.params.lastYear,
    lastMonth: request.params.lastMonth,
    months: request.params.months,
  }

  if (payload.months > 12) {
    response.error({errcode: 1, message: '最多过去12个月的月度统计数据'})
  }

  getAreaLastMonthPerformance(payload).then((stat) => {
    response.success({errcode: 0, statistics: stat})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取统计数据失败'})
  })
}

/**
 * 获取过去几个月某地区下辖地区的业绩统计数据，返回值以区域名作为区分的主键
 * @param request
 * @param response
 */
function fetchArealastMonthsPerformance(request, response) {
  var level = request.params.level
  var province = request.params.province
  var city = request.params.city
  var lastYear = request.params.lastYear
  var lastMonth = request.params.lastMonth
  var months = request.params.months
  var area = ''
  var areaType = ''

  if (LEVEL_PROVINCE == level) {
    area = province
    areaType = 'province'
  } else if (LEVEL_CITY == level) {
    area = city
    areaType = 'city'
  } else {
    response.error({errcode: 1, message: '不支持的地区级别'})
  }

  getSubAreaByAreaName(area, areaType).then((subAreas) => {
    var newLevel = level - 1
    var ops = []
    subAreas.forEach((subArea) => {
      var payload = {
        level: newLevel,
        province: province,
        city: LEVEL_CITY == newLevel ? subArea.area_name : city,
        district: LEVEL_CITY == newLevel ? undefined : subArea.area_name,
        lastYear: lastYear,
        lastMonth: lastMonth,
        months: months,
      }
      ops.push(getAreaLastMonthPerformance(payload))
    })
    return Promise.all(ops)
  }).then((stat) => {
    response.success({errcode: 0, statistics: stat})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取统计数据失败'})
  })
}

/**
 * 获取过去几个月某地区下辖地区的业绩统计数据，返回值以月份作为区分的主键
 * @param request
 * @param response
 */
function fetchAreaMonthsPerformance(request, response) {
  var level = request.params.level
  var province = request.params.province
  var city = request.params.city
  var lastYear = request.params.lastYear
  var lastMonth = request.params.lastMonth
  var months = request.params.months

  var beginYear = lastYear
  var beginMonth = lastMonth
  if (lastMonth - months < 0) {
    beginYear = beginYear - 1
    beginMonth = 12 - (months - lastMonth) + 1
  } else {
    beginMonth = lastMonth - months
  }

  var ops = []
  for (var i = 0; i < months; i++) {
    var currYear = beginYear
    var currMonth = beginMonth + i
    if (currMonth > 12) {
      currMonth = currMonth - 12
      currYear = currYear + 1
    }
    var payload = {
      level: level,
      province: province,
      city: city,
      year: currYear,
      month: currMonth,
    }
    ops.push(getSubAreaMonthPerformance(payload))
  }

  Promise.all(ops).then((stat) => {
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
  fetchLastMonthsPerformance: fetchLastMonthsPerformance,
  fetchAreaMonthPerformance: fetchAreaMonthPerformance,
  fetchArealastMonthsPerformance: fetchArealastMonthsPerformance,
  fetchAreaMonthsPerformance: fetchAreaMonthsPerformance,
}

module.exports = StatFuncs