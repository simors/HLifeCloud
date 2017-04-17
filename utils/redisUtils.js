var Promise = require('bluebird');
var redis = require('redis');
var GLOBAL_CONFIG = require('../config')

//异步支持
//通过这样的配置之后，原先的同步操作 API 依旧保留，在同步 API 方法名后追加 Async 即为新的异步 API
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var client = null;

function getClient() {
	if(!client) {
		client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
	  client.auth(GLOBAL_CONFIG.REDIS_AUTH, function(){
	  	console.log('redis...通过认证')
	  })
	  client.select(GLOBAL_CONFIG.REDIS_DB)

	  client.on('ready',function(err){
		  console.log('redis...ready');
		});

	  client.on('error', function (err) {
	    console.log('redis...error====>>>', err)
	    throw err
	  });
	}
	return client
}

function getAsync(key) {
	// console.log('getClient.before.client====', client)
	getClient()
	// console.log('getClient.after.client====', client)
	if(!client) {
		return new Promise((resolve, reject)=>{
			resolve('client不存在')
		})
	}

	return client.getAsync(key).then((res) => {
		// console.log('getAsync.key===', key)
		// console.log('getAsync.res===', res)
		return res
	}, (reason)=>{
		console.log('getAsync.reason====', reason)
		return reason
	})
}

function setAsync(key ,value, options) {
	getClient()

	if(!client) {
		return new Promise((resolve, reject)=>{
			resolve('client不存在')
		})
	}

	return client.setAsync(key, value).then((res) => {
		if(options) {
			if(options.expireSeconds) {
				client.expire(key, options.expireSeconds)
			}
		}
		return res
	}, (reason)=>{
		console.log('getAsync.reason====', reason)
		return reason
	})

}

function delAsync(key) {
	getClient()
	// console.log('getClient.after.client====', client)
	if(!client) {
		return new Promise((resolve, reject)=>{
			resolve('client不存在')
		})
	}

	return client.delAsync(key).then((res)=>{
		// console.log('delAsync.success.res====', res)
		if(1 == res) {
			return true
		}
		return false
	}, (reason)=>{
		console.log('delAsync.reason====', reason)
		return reason
	})
}

var redisUtils = {
  getAsync: getAsync,
  setAsync: setAsync,
  delAsync: delAsync,
}

module.exports = redisUtils