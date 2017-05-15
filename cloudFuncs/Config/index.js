var redis = require('redis');
var Promise = require('bluebird')
var AV = require('leanengine');
var redisUtils = require('../../utils/redisUtils')
var sysCfgUtil = require('../../utils/sysCfgUtil')
var sysCfgNames = require('../../constants/systemConfigNames')
var GLOBAL_CONFIG = require('../../config')


const PREFIX = 'share:'

const defaultDomain = 'http://share.xiaojee.cn/'

function fetchAppServicePhone(request, response) {
	sysCfgUtil.getCfgValueByCache(sysCfgNames.SERVICE_PHONE).then((servicePhone)=>{
		response.success({
      errcode: '0',
      message: servicePhone
    })
	}, (error)=>{
		console.log('fetchAppServicePhone.error====', error)
    response.error({
      errcode: '-1',
      message: error.message || '网络异常'
    })
  })
}

/**
 * 配置云引擎域名
 * @param request
 * @param response
 */
function setShareDomain(request, response) {
  var domain = request.params.shareDomain
  if (!domain) {
    domain = defaultDomain
  }

  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  client.on('error', function (err) {
    response.error({errcode: 1, message: '配置云引擎域名失败，请重试！'})
  })

  client.setAsync(PREFIX + "domain", domain).then(() => {

    response.success({
      errcode: 0,
      message: '配置云引擎域名成功！',
    })
  }).catch((error) => {
    console.log(error)
    response.error(error)
  })

}

function getShareDomain(request, response) {

  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  client.on('error', function (err) {
    console.log(err)
  })

  return client.getAsync(PREFIX + "domain").then((domain) => {
    response.success({
      shareDomain: domain
    })
  }).catch((error) => {
    console.log(error)
    response.error(error)
  })

}

var configFunc = {
  fetchAppServicePhone: fetchAppServicePhone,
  getShareDomain: getShareDomain,
  setShareDomain: setShareDomain,
}

module.exports = configFunc