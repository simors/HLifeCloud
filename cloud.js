var AV = require('leanengine');

var utilFunc = require('./cloudFuncs/util')
var authFunc = require('./cloudFuncs/Auth');
var shopFunc = require('./cloudFuncs/Shop');
var configFunc = require('./cloudFuncs/Config');
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
var TenantFeeFunc = require('./cloudFuncs/Promoter/TenantFee')
var PingppFunc = require('./cloudFuncs/Pingpp')
var UserFeedback = require('./adminCloudFuncs/userFeedback/userFeedback')
var topicFunc = require('./cloudFuncs/Topic')
var statFunc = require('./cloudFuncs/Statistics/PerformanceStat')
var searchFunc = require('./cloudFuncs/Search')
var goodsFunc = require('./cloudFuncs/Shop/ShopGoods')
var mpMsgFuncs = require('./mpFuncs/Message')
var ShopOrdersFunc = require('./cloudFuncs/Shop/ShopOrders')
var ShopOrdersFuncV2 = require('./cloudFuncs/ShopV2/ShopOrder')

var goodsFuncV2 = require('./cloudFuncs/ShopV2/ShopGoods')
var mpJsSdkFuncs = require('./mpFuncs/JSSDK')
var addrFuncs = require('./cloudFuncs/ShopV2/UserAddress')

/**
 * 云函数
 */
AV.Cloud.define('hLifeUpdateUserLocationInfo', authFunc.updateUserLocationInfo)
// 邀请码
AV.Cloud.define('utilVerifyInvitationCode', utilFunc.verifyInvitationCode)
AV.Cloud.define('utilGetInvitationCode',utilFunc.getInvitationCode)
AV.Cloud.define('utilGetWechatUpUserUnionid',utilFunc.getWechatUpUserUnionid)

AV.Cloud.define('hLifeFetchUserFollowees', authFunc.fetchUserFollowees)
AV.Cloud.define('hLifeFetchUserFollowers', authFunc.fetchUserFollowers)
AV.Cloud.define('hLifeLogin', authFunc.login)
AV.Cloud.define('hLifeModifyMobilePhoneVerified', authFunc.modifyMobilePhoneVerified)
AV.Cloud.define('hLifeGetDocterList', authFunc.getDocterList)
AV.Cloud.define('hLifeGetDocterGroup', authFunc.getDocterGroup)
AV.Cloud.define('hLifeGetUserinfoById', authFunc.getUserinfoById)
AV.Cloud.define('hLifeGetUsers', authFunc.getUsers)
AV.Cloud.define('getArticleLikers',authFunc.getArticleLikers)
AV.Cloud.define('hLifeSetUserNickname', authFunc.setUserNickname)
AV.Cloud.define('isWXUnionIdSignIn', authFunc.isWXUnionIdSignIn)
AV.Cloud.define('bindWithWeixin', authFunc.bindWithWeixin)
AV.Cloud.define('isWXBindByPhone', authFunc.isWXBindByPhone)
AV.Cloud.define('setUserOpenid', authFunc.setUserOpenid)
AV.Cloud.define('authTest', authFunc.authTest)

AV.Cloud.define('hLifeFetchAppServicePhone', configFunc.fetchAppServicePhone)
AV.Cloud.define('configGetShareDomain', configFunc.getShareDomain)
AV.Cloud.define('configSetShareDomain', configFunc.setShareDomain)

//话题app端
AV.Cloud.define('hLifeFetchTopicComments', topicFunc.fetchTopicComments)
AV.Cloud.define('disableTopicByUser', topicFunc.disableTopicByUser)
AV.Cloud.define('fetchTopicList', topicFunc.fetchTopicList)
AV.Cloud.define('fetchTopicDetailInfo', topicFunc.fetchTopicDetailInfo)
AV.Cloud.define('hlifeTopicFetchComments', topicFunc.fetchTopicCommentsV2)
AV.Cloud.define('hlifeTopicFetchUserUps', topicFunc.fetchUserUps)
AV.Cloud.define('hlifeTopicUpByUser', topicFunc.upByUser)
AV.Cloud.define('hlifeTopicPubulishTopicComment', topicFunc.pubulishTopicComment)
AV.Cloud.define('fetchUpsByTopicId', topicFunc.fetchUpsByTopicId)
AV.Cloud.define('topicPublishTopic', topicFunc.topicPublishTopic)
AV.Cloud.define('topicUpdateTopic', topicFunc.topicUpdateTopic)


//店铺app端
AV.Cloud.define('hLifeFetchShopCommentList',shopFunc.fetchShopCommentList)
AV.Cloud.define('hLifeFetchShopCommentReplyList',shopFunc.fetchShopCommentReplyList)
AV.Cloud.define('hLifeFetchShopCommentUpedUserList',shopFunc.fetchShopCommentUpedUserList)
AV.Cloud.define('hLifeShopCertificate',shopFunc.shopCertificate)
AV.Cloud.define('shopCertificateWithoutInviteCode',shopFunc.shopCertificateWithoutInviteCode)
AV.Cloud.define('hLifeGetShopInviter',shopFunc.getShopInviter)
AV.Cloud.define('hLifeGetShopPromotionMaxNum',shopFunc.getShopPromotionMaxNum)
AV.Cloud.define('hLifeUnregistShop', shopFunc.unregistShop)
AV.Cloud.define('hLifeFetchShopFollowers', shopFunc.fetchShopFollowers)
AV.Cloud.define('hLifeUpdateShopLocationInfo', shopFunc.updateShopLocationInfo)
AV.Cloud.define('hLifeShareShopPromotionById', shopFunc.shareShopPromotionById)
AV.Cloud.define('hLifeUpdateShopInfoAfterPaySuccess', shopFunc.updateShopInfoAfterPaySuccessCloud)
AV.Cloud.define('shopFetchNearbyPromotion', shopFunc.fetchNearbyShopPromotion)
AV.Cloud.define('shopModifyPromotionGeoPoint', shopFunc.modifyPromotionGeoPoint)
AV.Cloud.define('submitCompleteShopInfo',shopFunc.submitCompleteShopInfo)
AV.Cloud.define('submitEditShopInfo',shopFunc.submitEditShopInfo)
AV.Cloud.define('shopFetchNearbyShops', shopFunc.fetchNearbyShops)
AV.Cloud.define('submitShopPromotion', shopFunc.submitShopPromotion)
AV.Cloud.define('fetchNearbyShopGoodPromotion', shopFunc.fetchNearbyShopGoodPromotion)
AV.Cloud.define('fetchCloPromotionsByShopId', shopFunc.fetchCloPromotionsByShopId)
AV.Cloud.define('fetchOpenPromotionsByShopId', shopFunc.fetchOpenPromotionsByShopId)
AV.Cloud.define('getShopPromotionDayPay', shopFunc.getShopPromotionDayPay)
AV.Cloud.define('closeShopPromotion', shopFunc.closeShopPromotion)
AV.Cloud.define('pubulishShopComment', shopFunc.pubulishShopComment)
AV.Cloud.define('fetchShopComments', shopFunc.fetchShopComments)
AV.Cloud.define('fetchMyShopCommentsUps', shopFunc.fetchMyShopCommentsUps)
AV.Cloud.define('userUpShopComment', shopFunc.userUpShopComment)



// 店铺商品
AV.Cloud.define('goodsAddShopGoods', goodsFunc.addNewShopGoods)
AV.Cloud.define('goodsModifyShopGoods', goodsFunc.modifyShopGoodsInfo)
AV.Cloud.define('goodsShopGoodsOnline', goodsFunc.shopGoodsOnline)
AV.Cloud.define('goodsShopGoodsOffline', goodsFunc.shopGoodsOffline)
AV.Cloud.define('goodsShopGoodsDelete', goodsFunc.shopGoodsDelete)
AV.Cloud.define('goodsFetchGoodsList', goodsFunc.fetchShopGoods)

AV.Cloud.define('goodsFetchGoodsDetail', goodsFuncV2.fetchShopGoodsDetail)
AV.Cloud.define('goodsFetchNearbyGoodPromotion', goodsFuncV2.fetchNearbyGoodPromotion)


// 订单管理
AV.Cloud.define('orderCreateOrder', ShopOrdersFunc.handleNewShopOrderReq)
AV.Cloud.define('orderModifyStatus', ShopOrdersFunc.modifyOrderStatus)
AV.Cloud.define('orderQueryOrders', ShopOrdersFunc.queryShopOrders)
AV.Cloud.define('orderQueryOrdersV2', ShopOrdersFuncV2.queryShopOrders)


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
AV.Cloud.define('updateTopicStatus',TopicManagerFunc.updateTopicStatus)

AV.Cloud.define('getAdviseList',UserFeedback.getAdviseList)
AV.Cloud.define('readAdvise',UserFeedback.readAdvise)

AV.Cloud.define('getAdminTopicCategoryList',TopicManagerFunc.getTopicCategoryList)
AV.Cloud.define('getPickedTopicList',TopicManagerFunc.getPickedTopicList)
AV.Cloud.define('updateTopicPicked',TopicManagerFunc.updateTopicPicked)
AV.Cloud.define('updateTopicCategoryId',TopicManagerFunc.updateTopicCategoryId)
AV.Cloud.define('createNewTopicCategory',TopicManagerFunc.createNewTopicCategory)
AV.Cloud.define('updateTopicCategoryPicked',TopicManagerFunc.updateTopicCategoryPicked)
AV.Cloud.define('updateUserFromAdmin',userManagerFunc.updateUserFromAdmin)
AV.Cloud.define('updateMyPassword',userManagerFunc.updateMyPassword)
AV.Cloud.define('getShopCategoryList',ShopManagerFunc.getShopCategoryList)
AV.Cloud.define('getShopTagList',ShopManagerFunc.getShopTagList)
AV.Cloud.define('createShopCategory',ShopManagerFunc.createShopCategory)
AV.Cloud.define('updateShopCategory',ShopManagerFunc.updateShopCategory)
AV.Cloud.define('updateShopCategoryId',ShopManagerFunc.updateShopCategoryId)
AV.Cloud.define('setPromotionDayPay',ShopManagerFunc.setPromotionDayPay)
AV.Cloud.define('setPromotionMaxNum',ShopManagerFunc.setPromotionMaxNum)
AV.Cloud.define('setShopConfig',ShopManagerFunc.setShopConfig)
AV.Cloud.define('getShopConfig',ShopManagerFunc.getShopConfig)

AV.Cloud.define('adminFetchShopGoods',ShopManagerFunc.fetchShopGoods)
AV.Cloud.define('adminFetchPromotionsByShopId',ShopManagerFunc.fetchPromotionsByShopId)


AV.Cloud.define('createShopTag',ShopManagerFunc.createShopTag)
AV.Cloud.define('updateShopTag',ShopManagerFunc.updateShopTag)
AV.Cloud.define('getShopList',ShopManagerFunc.getShopList)
AV.Cloud.define('updateChoosenCategory',ShopManagerFunc.updateChoosenCategory)
AV.Cloud.define('updateShopStatus',ShopManagerFunc.updateShopStatus)
AV.Cloud.define('getAnnouncementsByShopId',ShopManagerFunc.getAnnouncementsByShopId)
AV.Cloud.define('AdminShopCommentList',ShopManagerFunc.AdminShopCommentList)
AV.Cloud.define('updateReplyStatus',ShopManagerFunc.updateReplyStatus)
AV.Cloud.define('updateCommentStatus',ShopManagerFunc.updateCommentStatus)
AV.Cloud.define('deleteShopCoverImg',ShopManagerFunc.deleteShopCoverImg)


AV.Cloud.define('updateCategoryStatus',ShopManagerFunc.updateCategoryStatus)
AV.Cloud.define('getAppUserList',userManagerFunc.getAppUserList)
AV.Cloud.define('getShopByUserId',userManagerFunc.getShopByUserId)
AV.Cloud.define('getUserDetailById',userManagerFunc.getUserDetailById)
AV.Cloud.define('addVirtualUserByAdmin',userManagerFunc.addVirtualUserByAdmin)

AV.Cloud.define('updateAppUserEnable',userManagerFunc.updateAppUserEnable)
AV.Cloud.define('getActionList',ActionManagerFunc.getActionList)
AV.Cloud.define('updateBannersStatus',ActionManagerFunc.updateBannersStatus)
AV.Cloud.define('createBanner',ActionManagerFunc.createBanner)
AV.Cloud.define('updateBanner',ActionManagerFunc.updateBanner)
AV.Cloud.define('hLifePush',PushManagerFunc.push)
AV.Cloud.define('hLifeFetchSmsUserList',SmsManagerFunc.fetchSmsUserList)
AV.Cloud.define('hLifeSendSms',SmsManagerFunc.sendSms)

//百度地图
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
AV.Cloud.define('promoterGetUpPromoter', PromoterFunc.getUpPromoterByUserId)
AV.Cloud.define('promoterFinishPayment', PromoterFunc.finishPromoterPayment)
AV.Cloud.define('promoterFetchByUser', PromoterFunc.fetchPromoterByUser)
AV.Cloud.define('promoterSetAgent', PromoterFunc.setPromoterAgent)
AV.Cloud.define('promoterGetAgent', PromoterFunc.fetchPromoterAgent)
AV.Cloud.define('promoterCancelAgent', PromoterFunc.cancelPromoterAgent)
AV.Cloud.define('promoterFetchPromoter', PromoterFunc.fetchPromoter)
AV.Cloud.define('promoterFetchNonAgentPromoter', PromoterFunc.fetchNonAgentPromoter)
AV.Cloud.define('promoterGetPromoterDetail', PromoterFunc.fetchPromoterDetail)
AV.Cloud.define('promoterDirectSetPromoter', PromoterFunc.directSetPromoter)
AV.Cloud.define('promoterDistributeInviteShopEarnings', PromoterFunc.distributeInviteShopEarnings)
AV.Cloud.define('promoterDistributeInvitePromoterEarnings', PromoterFunc.distributeInvitePromoterEarnings)
AV.Cloud.define('promoterGetPromoterTeam', PromoterFunc.fetchPromoterTeam)
AV.Cloud.define('promoterGetPromoterTeamById', PromoterFunc.fetchPromoterTeamById)
AV.Cloud.define('promoterGetPromoterShops', PromoterFunc.fetchPromoterShop)
AV.Cloud.define('promoterGetPromoterShopsById', PromoterFunc.fetchPromoterShopById)
AV.Cloud.define('promoterGetPromoterTenant', PromoterFunc.getPromoterTenant)
AV.Cloud.define('promoterGetTotalPerformance', PromoterFunc.getTotalPerformanceStat)
AV.Cloud.define('promoterGetAreaAgentManager', PromoterFunc.getAreaAgentManagers)
AV.Cloud.define('promoterGetPromoterByNameOrId', PromoterFunc.fetchPromoterByNameOrId)
AV.Cloud.define('promoterGetEarningRecords', PromoterFunc.fetchEarningRecords)
AV.Cloud.define('promoterSyncPromoterInfo', PromoterFunc.syncPromoterInfo)
AV.Cloud.define('promoterSupplementPromoterInfo', PromoterFunc.supplementPromoterInfo)
AV.Cloud.define('promoterGetPromoterQrCode', PromoterFunc.getPromoterQrCode)
AV.Cloud.define('promoterTest', PromoterFunc.promoterTest)
AV.Cloud.define('promoterCleanTeamMem', PromoterFunc.handleCleanPromoterTeamMem)
AV.Cloud.define('promoterStatLevelTeamMem', PromoterFunc.handleStatLevelTeamMem)
AV.Cloud.define('promoterCleanUpUser', PromoterFunc.handleCleanUpUser)
AV.Cloud.define('promoterChangeUpUser', PromoterFunc.handleChangeUpUser)
AV.Cloud.define('promoterGetFriends', PromoterFunc.getPromoterFriends)

// 店铺入驻费用
AV.Cloud.define('promoterGetShopTenantFeeList', TenantFeeFunc.fetchShopTenantFee)
AV.Cloud.define('promoterGetShopTenantByCity', TenantFeeFunc.getShopTenantByCity)
AV.Cloud.define('promoterSetShopTenant', TenantFeeFunc.setShopTenantFee)

//Ping++支付
AV.Cloud.define('hLifeCreatePayment', PingppFunc.createPayment)
AV.Cloud.define('hLifeCreateTransfers', PingppFunc.createTransfers)
AV.Cloud.define('hLifePaymentEvent', PingppFunc.paymentEvent)
AV.Cloud.define('hLifeTransfersEvent', PingppFunc.transfersEvent)
AV.Cloud.define('hLifeIdNameCardNumberIdentify', PingppFunc.idNameCardNumberIdentify)
AV.Cloud.define('hLifeGetPaymentInfoByUserId', PingppFunc.getPaymentInfoByUserId)
AV.Cloud.define('hLifeSetPaymentPassword', PingppFunc.setPaymentPassword)
AV.Cloud.define('hLifePaymentPasswordAuth', PingppFunc.paymentPasswordAuth)
AV.Cloud.define('PingppFuncTest', PingppFunc.PingppFuncTest)
AV.Cloud.define('pingPPFetchDealRecords', PingppFunc.fetchDealRecords)
AV.Cloud.define('pingPPGetWithdrawFee', PingppFunc.getWithdrawFee)
AV.Cloud.define('pingPPSetWithdrawFee', PingppFunc.setWithdrawFee)

// 统计方法
AV.Cloud.define('statPromoterPerformance', statFunc.statPromoterPerformance)
AV.Cloud.define('statFetchDailyPerformance', statFunc.fetchDaliyPerformance)
AV.Cloud.define('statFetchLastDaysPerformance', statFunc.fetchLastDaysPerformance)
AV.Cloud.define('statPromoterMonthPerformance', statFunc.statMonthPerformance)
AV.Cloud.define('statFetchMonthPerformance', statFunc.fetchMonthPerformance)
AV.Cloud.define('statFetchLastMonthsPerformance', statFunc.fetchLastMonthsPerformance)
AV.Cloud.define('statFetchAreaMonthPerformance', statFunc.fetchAreaMonthPerformance)
AV.Cloud.define('statFetchAreaLastMonthsPerformance', statFunc.fetchArealastMonthsPerformance)
AV.Cloud.define('statFetchAreaMonthsPerformance', statFunc.fetchAreaMonthsPerformance)

// 搜索
AV.Cloud.define('searchFetchSearchResult', searchFunc.fetchSearchResult)
AV.Cloud.define('searchFetchUserResult', searchFunc.fetchUserResult)
AV.Cloud.define('searchFetchShopResult', searchFunc.fetchShopResult)
AV.Cloud.define('searchFetchTopicResult', searchFunc.fetchTopicResult)

//微信api
AV.Cloud.define('wechatMessageTest', mpMsgFuncs.wechatMessageTest)
AV.Cloud.define('wechatGetJsConfig', mpJsSdkFuncs.getJsConfig)

//地址管理
AV.Cloud.define('addrGetAddrs', addrFuncs.getAddrs)
AV.Cloud.define('addrCreateAddr', addrFuncs.createAddr)
AV.Cloud.define('addrUpdateAddr', addrFuncs.updateAddr)
AV.Cloud.define('addrDisableAddr', addrFuncs.disableAddr)
AV.Cloud.define('addrSetDefaultAddr', addrFuncs.setDefaultAddr)
AV.Cloud.define('addrTestAddFunc', addrFuncs.testAddFunc)

module.exports = AV.Cloud;
