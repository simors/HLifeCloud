/**
 * Created by wanpeng on 2017/6/26.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var redis = require('redis');
var GLOBAL_CONFIG = require('../../config')


const PREFIX = 'unionid:'

function bindWechatUnionid(upUserUnionid, unionid) {
  Promise.promisifyAll(redis.RedisClient.prototype);
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    console.log("error:", err)
  });
  var key = PREFIX + unionid

  return client.setAsync(key, upUserUnionid).then((reply) => {
    client.expireAsync(key, 24 * 60 * 60)  //过期时间24小时
  }).finally(() => {
    client.quit()
  })

}


function getUpUserUnionid(unionid) {
  Promise.promisifyAll(redis.RedisClient.prototype);
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    console.log("error:", err)
  });
  var key = PREFIX + unionid
  return client.getAsync(key).then((reply) => {
    if(reply != null) {
      return reply
    }
  }).finally(() => {
    client.quit()
  })
}

function getWechatUpUserUnionid(request, response) {
  var unionid = request.params.unionid

  if(unionid) {
    getUpUserUnionid(unionid).then((reply) => {
      if (reply) {
        response.success({
          errcode: 0,
          reply: reply,
        })
      } else {
        response.error({
          errcode: 1,
          reply: undefined,
        })
      }
    })
  } else {
    response.error({
      errcode: 1,
      reply: undefined,
    })
  }
}



var wechatBoundOpenidFunc = {
  bindWechatUnionid: bindWechatUnionid,
  getUpUserUnionid: getUpUserUnionid,
  getWechatUpUserUnionid: getWechatUpUserUnionid

}

module.exports = wechatBoundOpenidFunc
