var AV = require('leanengine');

var utilFunc = require('./cloudFuncs/util')
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
var SmsManagerFunc = require('./adminCloudFuncs/SmsManager/smsManger')
var baiduFunc = require('./cloudFuncs/baidu')
var PromoterFunc = require('./cloudFuncs/Promoter')
var PingppFunc = require('./cloudFuncs/Pingpp')

/**
 * 云函数
 */
AV.Cloud.define('hLifeUpdateUserLocationInfo', authFunc.updateUserLocationInfo)
// 邀请码
AV.Cloud.define('utilVerifyInvitationCode', utilFunc.verifyInvitationCode)
AV.Cloud.define('utilGetInvitationCode',utilFunc.getInvitationCode)

AV.Cloud.define('hLifeModifyMobilePhoneVerified', authFunc.modifyMobilePhoneVerified)
AV.Cloud.define('hLifeGetDocterList', authFunc.getDocterList)
AV.Cloud.define('hLifeGetDocterGroup', authFunc.getDocterGroup)
AV.Cloud.define('hLifeGetUserinfoById', authFunc.getUserinfoById)
AV.Cloud.define('hLifeGetUsers', authFunc.getUsers)
AV.Cloud.define('getArticleLikers',authFunc.getArticleLikers)
AV.Cloud.define('hLifeSetUserNickname', authFunc.setUserNickname)
AV.Cloud.define('hLifeFetchShopCommentList',shopFunc.fetchShopCommentList)
AV.Cloud.define('hLifeFetchShopCommentReplyList',shopFunc.fetchShopCommentReplyList)
AV.Cloud.define('hLifeFetchShopCommentUpedUserList',shopFunc.fetchShopCommentUpedUserList)
AV.Cloud.define('hLifeShopCertificate',shopFunc.shopCertificate)
AV.Cloud.define('hLifeGetShopInviter',shopFunc.getShopInviter)
AV.Cloud.define('hLifeGetShopPromotionMaxNum',shopFunc.getShopPromotionMaxNum)

AV.Cloud.define('getArticleCommentList',articleFunc.getArticleCommentList)
AV.Cloud.define('addArticleCategory',articleFunc.addArticleCategory)
AV.Cloud.define('updateCategoryWithoutType',articleFunc.updateCategoryWithoutType)
AV.Cloud.define('getMenuList',PrivilegeFunc.getMenuList)
AV.Cloud.define('getMenuListByLogin',PrivilegeFunc.getMenuListByLogin)
AV.Cloud.define('getPermissionListOnlyByLogin',PrivilegeFunc.getPermissionListOnlyByLogin)
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
AV.Cloud.define('getShopByUserId',userManagerFunc.getShopByUserId)
AV.Cloud.define('updateAppUserEnable',userManagerFunc.updateAppUserEnable)
AV.Cloud.define('getActionList',ActionManagerFunc.getActionList)
AV.Cloud.define('updateBannersStatus',ActionManagerFunc.updateBannersStatus)
AV.Cloud.define('createBanner',ActionManagerFunc.createBanner)
AV.Cloud.define('updateBanner',ActionManagerFunc.updateBanner)
AV.Cloud.define('hLifePush',PushManagerFunc.push)
AV.Cloud.define('hLifeFetchSmsUserList',SmsManagerFunc.fetchSmsUserList)
AV.Cloud.define('hLifeSendSms',SmsManagerFunc.sendSms)


AV.Cloud.define('hLifeGetSubAreaList', baiduFunc.getSubAreaList)
AV.Cloud.define('hLifeGetSubAreaList2', baiduFunc.getSubAreaList2)
AV.Cloud.define('hLifeGetProviceList', baiduFunc.getProviceList)
AV.Cloud.define('hLifeGetCityList', baiduFunc.getCityList)
AV.Cloud.define('hLifeGetDistrictList', baiduFunc.getDistrictList)
AV.Cloud.define('hLifeGetAllCityMap', baiduFunc.getAllCityMap)

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

// 推广人
AV.Cloud.define('promoterGetSysConfig', PromoterFunc.fetchPromoterSysConfig)
AV.Cloud.define('promoterSetSysConfig', PromoterFunc.setPromoterSysConfig)
AV.Cloud.define('promoterCertificate', PromoterFunc.promoterCertificate)
AV.Cloud.define('promoterGetUpPromoter', PromoterFunc.getUpPromoter)
AV.Cloud.define('promoterFinishPayment', PromoterFunc.finishPromoterPayment)
AV.Cloud.define('promoterFetchByUser', PromoterFunc.fetchPromoterByUser)
AV.Cloud.define('promoterSetAgent', PromoterFunc.setPromoterAgent)
AV.Cloud.define('promoterGetAgent', PromoterFunc.fetchPromoterAgent)
AV.Cloud.define('promoterCancelAgent', PromoterFunc.cancelPromoterAgent)
AV.Cloud.define('promoterFetchPromoter', PromoterFunc.fetchPromoter)
AV.Cloud.define('promoterGetPromoterDetail', PromoterFunc.fetchPromoterDetail)
AV.Cloud.define('promoterDirectSetPromoter', PromoterFunc.directSetPromoter)

//Ping++支付
AV.Cloud.define('hLifeCreatePayment', PingppFunc.createPayment)
AV.Cloud.define('hLifePaymentEvent', PingppFunc.paymentEvent)


module.exports = AV.Cloud;
