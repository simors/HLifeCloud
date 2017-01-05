var AV = require('leanengine');

var authFunc = require('./cloudFuncs/Auth');
var shopFunc = require('./cloudFuncs/Shop');

/**
 * 云函数
 */
AV.Cloud.define('hLifeModifyMobilePhoneVerified', authFunc.modifyMobilePhoneVerified)
AV.Cloud.define('hLifeVerifyInvitationCode', authFunc.verifyInvitationCode)
AV.Cloud.define('hLifeGetDocterList', authFunc.getDocterList)
AV.Cloud.define('hLifeGetUserinfoById', authFunc.getUserinfoById)
AV.Cloud.define('getArticleLikers',authFunc.getArticleLikers)
AV.Cloud.define('hLifeFetchShopCommentList',shopFunc.fetchShopCommentList)
AV.Cloud.define('hLifeFetchShopCommentReplyList',shopFunc.fetchShopCommentReplyList)
module.exports = AV.Cloud;
