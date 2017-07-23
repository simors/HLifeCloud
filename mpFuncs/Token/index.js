/**
 * Created by wanpeng on 2017/7/23.
 */
var redis = require('redis');
var Promise = require('bluebird')
var GLOBAL_CONFIG = require('../../config')

const PREFIX = 'wechatApiToken'


function getApiTokenFromRedis(callback) {
  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    response.error({errcode: 1, message: '设置费率失败，请重试！'})
  })

  client.getAsync(PREFIX).then((token) => {
    callback(null, JSON.parse(token))
  }).finally(() => {
    client.quit()
  })
}

function setApiTokenToRedis(token, callback) {
  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    response.error({errcode: 1, message: '设置费率失败，请重试！'})
  })

  client.setAsync(PREFIX, JSON.stringify(token)).then(() => {
    callback
  }).finally(() => {
    client.quit()
  })
}

var mpTokenFuncs = {
  getApiTokenFromRedis: getApiTokenFromRedis,
  setApiTokenToRedis: setApiTokenToRedis
}

module.exports = mpTokenFuncs