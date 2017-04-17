var Promise = require('bluebird');
var AV = require('leanengine');
var redisUtils = require('./redisUtils')

function getCfgValue(configName) {
	var query = new AV.Query('SystemConfig')
  query.equalTo('cfgName', configName)
  return query.first().then((result)=>{
  	var cfgValue = ''
  	if(result && result.id) {
  		cfgValue = result.attributes.cfgValue
  	}
    return cfgValue
  }, (error)=>{
    return error.message || '获取失败'
  })
}

function getCfgValueByCache(configName) {
	return redisUtils.getAsync(configName).then((configValue)=>{
		if(!configValue){
			return getCfgValue(configName).then((result)=>{
				if(result) {
					redisUtils.setAsync(configName, result)
				}
				return result
			}, (error)=>{
				return error.message || '获取失败'
			})
		}else{
			return configValue
		}
	}, (error)=>{
		return error.message || '获取失败'
	})
}

var systemConfigUtils = {
  getCfgValue: getCfgValue,
  getCfgValueByCache: getCfgValueByCache,
}

module.exports = systemConfigUtils