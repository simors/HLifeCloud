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

var job = schedule.scheduleJob('0 0 12 * * *', function() {
  var date = (new Date()).toLocaleDateString()
  runPromoterStat(date)
})

function runPromoterStat(date) {
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
      var PerformanceStat = AV.Object.extend('PromoterPerformanceStat')
      var performanceStat = new PerformanceStat()
      performanceStat.set('province', key.province)
      performanceStat.set('city', key.city)
      performanceStat.set('district', key.district)
      performanceStat.set('shopNum', stat.shopNum)
      performanceStat.set('promoterNum', stat.promoterNum)
      performanceStat.set('earning', stat.earn)
      saveOps.push(performanceStat.save())
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

function statPromoterPerformance(request, response) {
  var date = request.params.date
  if (!date) {
    date = new Date().toLocaleDateString()
  }
  runPromoterStat(date).then(() => {
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