var AV = require('leanengine');

var authFunc = require('./cloudFuncs/Auth');

/**
 * 云函数
 */
AV.Cloud.define('hLifeModifyMobilePhoneVerified', authFunc.modifyMobilePhoneVerified);
AV.Cloud.define('hLifeVerifyInvitationCode', authFunc.verifyInvitationCode);
module.exports = AV.Cloud;
