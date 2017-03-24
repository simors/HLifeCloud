/**
 * Created by yangyang on 2017/3/23.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var redis = require('redis');
var uuid = require('node-uuid');
var GLOBAL_CONFIG = require('../../config')

const CODE_EXPIRE = 3600

function getInvitationCodeOnceSuccessCB(payload) {
  payload.response.success({
    status: 0,
    result: payload.result,
  })
}

var errCount = 0;

function getInvitationCodeOnceErrorCB(userId, err, response) {
  errCount = errCount + 1
  if (errCount < 10) {
    getInvitationCodeOnce(userId, response)
  } else {
    response.success({
      status: err,
    })
  }
}

function getInvitationCodeOnce(userId, response) {
  Promise.promisifyAll(redis.RedisClient.prototype);
  var id = uuid.v4().substring(0, 8);
  // var client = redis.createClient(process.env['REDIS_URL_HLifeCache']);
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    getInvitationCodeOnceErrorCB(userId, err, response);
  });
  client.getAsync(id).then((reply) => {
    if (reply == null) {
      client.setAsync(id, userId).then((reply) => {
        client.expire(id, CODE_EXPIRE)
        getInvitationCodeOnceSuccessCB({
          status: 0,
          result: id,
          response: response,
        })
      })
    }
    else {
      getInvitationCodeOnceErrorCB(userId, 1, response)
    }
  });
}

function getInvitationCode(request, response) {
  var user = request.currentUser
  if (!user) {
    response.error({
      status: 1,
      message: '用户未登录',
    })
  }
  getInvitationCodeOnce(user.id, response)
}

function verifyCode(code) {
  Promise.promisifyAll(redis.RedisClient.prototype);
  // var client = redis.createClient(process.env['REDIS_URL_HLifeCache']);
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    console.log("error:", err)
  });
  return client.getAsync(code).then((reply) => {
    if (reply != null) {
      client.del(code)
      return reply
    } else {
      return undefined
    }
  })
}

function verifyInvitationCode(request, response) {
  var invitationsCode = request.params.invitationsCode

  if (invitationsCode) {
    verifyCode(invitationsCode).then((reply) => {
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

var inviteCodeFunc = {
  getInvitationCode: getInvitationCode,
  verifyInvitationCode: verifyInvitationCode,
  verifyCode: verifyCode,
}

module.exports = inviteCodeFunc