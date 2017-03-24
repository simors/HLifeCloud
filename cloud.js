var AV = require('leanengine');

var authFunc = require('./cloudFuncs/Auth');
var shopFunc = require('./cloudFuncs/Shop');
var articleFunc = require('./cloudFuncs/Article');
var PrivilegeFunc = require('./cloudFuncs/Privilege');
var userManagerFunc = require('./adminCloudFuncs/BKManager/userManager')
var TopicManagerFunc = require('./adminCloudFuncs/topicManager/topicManager')
var ShopManagerFunc = require('./adminCloudFuncs/shopManager/shopManager')
var ActionManagerFunc = require('./adminCloudFuncs/actionManager/actionManager')
var PointsMallFunc = require('./cloudFuncs/PointsMall')
var PushManagerFunc = require('./adminCloudFuncs/pushManager/pushManger')
var UtilFunc = require('./cloudFuncs/Util/utils')
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
AV.Cloud.define('hLifeSetUserNickname', authFunc.setUserNickname)
AV.Cloud.define('hLifeFetchShopCommentList',shopFunc.fetchShopCommentList)
AV.Cloud.define('hLifeFetchShopCommentReplyList',shopFunc.fetchShopCommentReplyList)
AV.Cloud.define('hLifeFetchShopCommentUpedUserList',shopFunc.fetchShopCommentUpedUserList)
AV.Cloud.define('getArticleCommentList',articleFunc.getArticleCommentList)
AV.Cloud.define('addArticleCategory',articleFunc.addArticleCategory)
AV.Cloud.define('updateCategoryWithoutType',articleFunc.updateCategoryWithoutType)
AV.Cloud.define('getMenuList',PrivilegeFunc.getMenuList)
AV.Cloud.define('getMenuListByLogin',PrivilegeFunc.getMenuListByLogin)
AV.Cloud.define('getPermissionListOnlyByLogin',PrivilegeFunc.getPermissionListOnlyByLogin)
AV.Cloud.define('hLifeGetInvitationCode',authFunc.getInvitationCode)
AV.Cloud.define('getAdminUserList',userManagerFunc.getUserList)
AV.Cloud.define('getAllRoleList',userManagerFunc.getAllRoleList)
AV.Cloud.define('addUserFromAdmin',userManagerFunc.addUserFromAdmin)
AV.Cloud.define('deleteUserFromAdmin',userManagerFunc.deleteUserFromAdmin)
AV.Cloud.define('getAdminTopicList',TopicManagerFunc.getTopicList)
AV.Cloud.define('getAdminTopicCategoryList',TopicManagerFunc.getTopicCategoryList)
AV.Cloud.define('getPickedTopicList',TopicManagerFunc.getPickedTopicList)
AV.Cloud.define('updateTopicPicked',TopicManagerFunc.updateTopicPicked)
AV.Cloud.define('createNewTopicCategory',TopicManagerFunc.createNewTopicCategory)
AV.Cloud.define('updateTopicCategoryPicked',TopicManagerFunc.updateTopicCategoryPicked)
AV.Cloud.define('updateUserFromAdmin',userManagerFunc.updateUserFromAdmin)
AV.Cloud.define('updateMyPassword',userManagerFunc.updateMyPassword)
AV.Cloud.define('getShopCategoryList',ShopManagerFunc.getShopCategoryList)
AV.Cloud.define('getShopTagList',ShopManagerFunc.getShopTagList)
AV.Cloud.define('createShopCategory',ShopManagerFunc.createShopCategory)
AV.Cloud.define('updateShopCategory',ShopManagerFunc.updateShopCategory)
AV.Cloud.define('createShopTag',ShopManagerFunc.createShopTag)
AV.Cloud.define('updateShopTag',ShopManagerFunc.updateShopTag)
AV.Cloud.define('getShopList',ShopManagerFunc.getShopList)
AV.Cloud.define('updateChoosenCategory',ShopManagerFunc.updateChoosenCategory)
AV.Cloud.define('updateShopStatus',ShopManagerFunc.updateShopStatus)
AV.Cloud.define('getAnnouncementsByShopId',ShopManagerFunc.getAnnouncementsByShopId)
AV.Cloud.define('AdminShopCommentList',ShopManagerFunc.AdminShopCommentList)
AV.Cloud.define('enableShopComment',ShopManagerFunc.enableShopComment)
AV.Cloud.define('disableShopComment',ShopManagerFunc.disableShopComment)
AV.Cloud.define('deleteShopCoverImg',ShopManagerFunc.deleteShopCoverImg)
AV.Cloud.define('updateCategoryStatus',ShopManagerFunc.updateCategoryStatus)
AV.Cloud.define('getAppUserList',userManagerFunc.getAppUserList)
AV.Cloud.define('updateAppUserEnable',userManagerFunc.updateAppUserEnable)
AV.Cloud.define('getActionList',ActionManagerFunc.getActionList)
AV.Cloud.define('updateBannersStatus',ActionManagerFunc.updateBannersStatus)
AV.Cloud.define('createBanner',ActionManagerFunc.createBanner)
AV.Cloud.define('updateBanner',ActionManagerFunc.updateBanner)
AV.Cloud.define('hLifePush',PushManagerFunc.push)
AV.Cloud.define('hLifeGetSubAreaList',UtilFunc.getSubAreaList)




// 用户积分
AV.Cloud.define('pointsGetUserPoint', PointsMallFunc.getUserPoint)
AV.Cloud.define('pointsCalUserRegist', PointsMallFunc.calUserRegist)
AV.Cloud.define('pointsCalRegistPromoter', PointsMallFunc.calRegistPromoter)
AV.Cloud.define('pointsCalRegistShoper', PointsMallFunc.calRegistShoper)
AV.Cloud.define('pointsCalPublishTopic', PointsMallFunc.calPublishTopic)
AV.Cloud.define('pointsCalPublishComment', PointsMallFunc.calPublishComment)
AV.Cloud.define('pointsCalPublishActivity', PointsMallFunc.calPublishActivity)
AV.Cloud.define('pointsCalInvitePromoter', PointsMallFunc.calInvitePromoter)
AV.Cloud.define('pointsCalInviteShoper', PointsMallFunc.calInviteShoper)




module.exports = AV.Cloud;
