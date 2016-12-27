var AV = require('leanengine');

var authFunc = require('./cloudFuncs/Auth');

/**
 * 云函数
 */
AV.Cloud.define('hLifeModifyMobilePhoneVerified', authFunc.modifyMobilePhoneVerified)
AV.Cloud.define('hLifeVerifyInvitationCode', authFunc.verifyInvitationCode)
AV.Cloud.define('hLifeGetDocterList', authFunc.getDocterList)
module.exports = AV.Cloud;
