/**
 * Created by wanpeng on 2017/9/4.
 */
var Promise = require('bluebird')
var wechat_api = require('../util/wechatUtil').wechat_api


function getWechatJsSdkConfig(request, response) {
  var debug = request.params.debug
  var jsApiList =  request.params.jsApiList
  var url = request.params.url

  var param = {
    debug: debug || false,
    jsApiList: jsApiList,
    url: url
  }
  wechat_api.getJsConfig(param, function (err, result) {
    if(err) {
      console.log("getWechatJsSdkConfig", err)
      response.error(err)
      return
    }
    response.success(result)
  })
}


var mpJsSdkFuncs = {
  getJsConfig: getWechatJsSdkConfig,
}

module.exports = mpJsSdkFuncs

