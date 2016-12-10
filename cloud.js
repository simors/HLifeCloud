var AV = require('leanengine');

var testFunc = require('./cloudFuncs/test');
var authFunc = require('./cloudFuncs/Auth');
/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function(request, response) {
  response.success('Hello world!');
});

/**
 * test 云函数
 */
AV.Cloud.define('test', testFunc.test);
AV.Cloud.define('hLifeModifyMobilePhoneVerified', authFunc.modifyMobilePhoneVerified);
module.exports = AV.Cloud;
