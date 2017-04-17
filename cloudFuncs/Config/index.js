var redis = require('redis');
var Promise = require('bluebird')
var AV = require('leanengine');
var redisUtils = require('../../utils/redisUtils')
var sysCfgUtil = require('../../utils/sysCfgUtil')
var sysCfgNames = require('../../constants/systemConfigNames')


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

var configFunc = {
  fetchAppServicePhone: fetchAppServicePhone,
}

module.exports = configFunc