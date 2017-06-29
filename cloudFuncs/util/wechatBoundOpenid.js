/**
 * Created by wanpeng on 2017/6/26.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var redis = require('redis');
var GLOBAL_CONFIG = require('../../config')


const PREFIX = 'openid:'

function bindOpenid(upUserOpenid, openid) {
  Promise.promisifyAll(redis.RedisClient.prototype);
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    console.log("error:", err)
  });
  var key = PREFIX + openid
  return client.getAsync(key).then((reply) => {
    if (reply != null) {
      return false
    } else {
      client.setAsync(key, upUserOpenid)
      return true
    }
  }).finally(() => {
    client.quit()
  })

}

function bindWechatOpenid(request, response) {
  openid = request.params.openid
  upUserOpenid = request.params.upUserOpenid


  if (openid && upUserOpenid) {
    bindOpenid(upUserOpenid, openid).then((reply) => {
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

function getUpUserOpenid(openid) {
  Promise.promisifyAll(redis.RedisClient.prototype);
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    console.log("error:", err)
  });
  var key = PREFIX + openid
  return client.getAsync(key).then((reply) => {
    if(reply != null) {
      return reply
    }
  }).finally(() => {
    client.quit()
  })
}

function getWechatUpUserOpenid(request, response) {
  var openid = request.params.openid

  if(openid) {
    getUpUserOpenid(openid).then((reply) => {
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
  bindWechatOpenid: bindWechatOpenid,
  getUpUserOpenid: getUpUserOpenid,
  getWechatUpUserOpenid: getWechatUpUserOpenid

}

module.exports = wechatBoundOpenidFunc
