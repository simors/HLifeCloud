/**
 * Created by yangyang on 2017/4/21.
 */
var schedule = require('node-schedule')
var mysqlUtil = require('../util/mysqlUtil')
var Promise = require('bluebird')
var AV = require('leanengine')
var redis = require('redis')

var job = schedule.scheduleJob('0 0 12 * * *', function() {
  console.log('execute job')
})

function runPromoterStat(date) {
  var mysqlConn = undefined
  var sql = ''

  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = 'SELECT * FROM `PromoterDeal` WHERE DATE_FORMAT(deal_time, \'%Y-%m-%d\') = ?'
    return mysqlUtil.query(conn, sql, [date])
  }).then((queryRes) => {
    console.log(queryRes.results)
    // 提前释放mysql连接
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
    mysqlConn = undefined
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
  })
}

function statPromoterPerformance(request, response) {
  var date = request.params.date
  if (!date) {
    var oldTime = (new Date('2017/04/08')).getTime()
    date = new Date(oldTime).toLocaleDateString()
  }
  runPromoterStat(date)
  response.success()
}

var StatFuncs = {
  statPromoterPerformance: statPromoterPerformance,
}

module.exports = StatFuncs