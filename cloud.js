var AV = require('leanengine');

var authFunc = require('./cloudFuncs/Auth');

/**
 * 云函数
 */
AV.Cloud.define('hLifeModifyMobilePhoneVerified', authFunc.modifyMobilePhoneVerified)
AV.Cloud.define('hLifeVerifyInvitationCode', authFunc.verifyInvitationCode)
AV.Cloud.define('hLifeGetDocterList', authFunc.getDocterList
AV.Cloud.define('getArticleLikers',authFunc.getArticleLikers)
module.exports = AV.Cloud;
