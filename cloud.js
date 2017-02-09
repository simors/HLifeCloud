var AV = require('leanengine');

var authFunc = require('./cloudFuncs/Auth');
var shopFunc = require('./cloudFuncs/Shop');
var articleFunc = require('./cloudFuncs/Article');
var PrivilegeFunc = require('./cloudFuncs/Privilege');

/**
 * 云函数
 */
AV.Cloud.define('hLifeModifyMobilePhoneVerified', authFunc.modifyMobilePhoneVerified)
AV.Cloud.define('hLifeVerifyInvitationCode', authFunc.verifyInvitationCode)
AV.Cloud.define('hLifeGetDocterList', authFunc.getDocterList)
AV.Cloud.define('hLifeGetDocterGroup', authFunc.getDocterGroup)
AV.Cloud.define('hLifeGetUserinfoById', authFunc.getUserinfoById)
AV.Cloud.define('hLifeGetUsers', authFunc.getUsers)
AV.Cloud.define('getArticleLikers',authFunc.getArticleLikers)
AV.Cloud.define('hLifeFetchShopCommentList',shopFunc.fetchShopCommentList)
AV.Cloud.define('hLifeFetchShopCommentReplyList',shopFunc.fetchShopCommentReplyList)
AV.Cloud.define('hLifeFetchShopCommentUpedUserList',shopFunc.fetchShopCommentUpedUserList)
AV.Cloud.define('getArticleCommentList',articleFunc.getArticleCommentList)
AV.Cloud.define('addArticleCategory',articleFunc.addArticleCategory)
AV.Cloud.define('getMenuList',PrivilegeFunc.getMenuList)
AV.Cloud.define('getMenuListByLogin',PrivilegeFunc.getMenuListByLogin)
AV.Cloud.define('getPermissionListOnlyByLogin',PrivilegeFunc.getPermissionListOnlyByLogin)


module.exports = AV.Cloud;
