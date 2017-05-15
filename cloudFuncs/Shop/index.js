/**
 * Created by zachary on 2017/01/04.
 */

var redis = require('redis');
var Promise = require('bluebird')
var AV = require('leanengine');
var shopUtil = require('../../utils/shopUtil');
var authUtils = require('../../utils/authUtils');
var inviteCodeFunc = require('../util/inviteCode')
var IDENTITY_SHOPKEEPER = require('../../constants/appConst').IDENTITY_SHOPKEEPER
var PromoterFunc = require('../Promoter')
var systemConfigNames = require('../../constants/systemConfigNames')
var redisUtils = require('../../utils/redisUtils')
var ejs = require('ejs')
var fs  = require('fs')

function constructShopInfo(leanShop) {
  var shop = {}
  var shopAttr = leanShop.attributes
  shop.id = leanShop.id
  shop.name = shopAttr.name
  shop.phone = shopAttr.phone
  shop.shopName = shopAttr.shopName
  shop.shopAddress = shopAttr.shopAddress
  shop.coverUrl = shopAttr.coverUrl
  shop.contactNumber = shopAttr.contactNumber
  shop.contactNumber2 = shopAttr.contactNumber2
  shop.certification = shopAttr.certification
  shop.status = shopAttr.status

  var targetShopCategory = {}
  if (shopAttr.targetShopCategory && shopAttr.targetShopCategory.attributes) {
    var targetShopCategoryAttr = shopAttr.targetShopCategory.attributes
    targetShopCategory.imageSource = targetShopCategoryAttr.imageSource
    targetShopCategory.shopCategoryId = targetShopCategoryAttr.shopCategoryId
    targetShopCategory.status = targetShopCategoryAttr.status
    targetShopCategory.text = targetShopCategoryAttr.text
    targetShopCategory.id = shopAttr.targetShopCategory.id
  }
  shop.targetShopCategory = targetShopCategory

  var owner = {}
  if (shopAttr.owner && shopAttr.owner.attributes) {
    var ownerAttrs = shopAttr.owner.attributes
    owner.nickname = ownerAttrs.nickname
    owner.avatar = ownerAttrs.avatar
    owner.id = shopAttr.owner.id
  }
  shop.owner = owner

  var containedTag = []
  if(shopAttr.containedTag && shopAttr.containedTag.length) {
    shopAttr.containedTag.forEach((item)=>{
      var containedTagAttrs = item.attributes
      var tag = {
        id: item.id,
        name: containedTagAttrs.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }
      containedTag.push(tag)
    })
  }
  shop.containedTag = containedTag

  var containedPromotions = []
  if(shopAttr.containedPromotions && shopAttr.containedPromotions.length) {
    shopAttr.containedPromotions.forEach((promotion)=>{
      // TODO: 获取推广信息
      var promotionRecord = {
        id: promotion.id,
      }
      containedPromotions.push(promotionRecord)
    })
  }
  shop.containedPromotions = containedPromotions

  shop.geo = shopAttr.geo
  shop.geoName = shopAttr.geoName
  shop.geoCity = shopAttr.geoCity
  shop.geoCityCode = shopAttr.geoCityCode
  shop.geoDistrictCode = shopAttr.geoDistrictCode
  shop.geoDistrict = shopAttr.geoDistrict
  shop.geoProvince = shopAttr.geoProvince
  shop.geoProvinceCode = shopAttr.geoProvinceCode
  shop.pv = shopAttr.pv
  shop.score = shopAttr.score
  shop.ourSpecial = shopAttr.ourSpecial
  shop.openTime = shopAttr.openTime
  shop.album = shopAttr.album
  shop.payment = shopAttr.payment
  shop.tenant = shopAttr.tenant
  shop.createdAt = leanShop.createdAt
  shop.updatedAt = leanShop.updatedAt

  return shop
}

function fetchShopCommentList(request, response) {
  var shopId = request.params.id
  var isRefresh = request.params.isRefresh
  var lastCreatedAt = request.params.lastCreatedAt

  var query = new AV.Query('ShopComment')

  if(!isRefresh) { //分页查询
    if(!lastCreatedAt) {
      response.success([])
      return
    }
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  //构建内嵌查询
  var innerQuery = new AV.Query('Shop')
  innerQuery.equalTo('objectId', shopId)
  //执行内嵌查询
  query.matchesQuery('targetShop', innerQuery)

  query.include(['targetShop', 'user'])

  query.addDescending('createdAt')
  query.limit(5) // 最多返回 5 条结果
  query.equalTo('status', 1)
  return query.find().then(function(results) {
    try{
      var shopComments = shopUtil.shopCommentFromLeancloudObject(results)

      if(shopComments && shopComments.length) {
        var queryArr = []
        var upQueryArr = []
        shopComments.forEach(function(item, index){
          var replyQuery = new AV.Query('ShopCommentReply')
          var shopComment = AV.Object.createWithoutData('ShopComment', item.id)
          replyQuery.equalTo('replyShopComment', shopComment)
          replyQuery.equalTo('status', 1)
          queryArr.push(replyQuery)

          var upQuery = new AV.Query('ShopCommentUp')
          upQuery.equalTo('targetShopComment', shopComment)
          upQueryArr.push(upQuery)
        })

        var orQuery = AV.Query.or.apply(null, queryArr)
        orQuery.include(['user', 'parentReply', 'parentReply.user'])
        orQuery.addAscending('createdAt')

        return orQuery.find().then(function(orResults){
          var replys = shopUtil.shopCommentReplyFromLeancloudObject(orResults)
          shopUtil.shopCommentsConcatReplys(shopComments, replys)
  
          var upOrQuery = AV.Query.or.apply(null, upQueryArr)
          upOrQuery.include(['user'])
          upOrQuery.addAscending('createdAt')
          // console.log('orResults==========', orResults)
          
          return upOrQuery.find().then(function(upOrResults) {
            try{
              // console.log('upOrResults==========', upOrResults)
              var ups = shopUtil.shopCommentUpFromLeancloudObject(upOrResults)
              // console.log('shopCommentUpFromLeancloudObject==========')
              shopUtil.shopCommentsConcatUps(shopComments, ups)
              // console.log('shopCommentsConcatUps==========')
              response.success(shopComments)
            }catch(err) {
              console.log('err==========', err)
            }
          }, function(upErr) {
            response.success(shopComments)
          })
          
        }, function(err) {
          response.success(shopComments)
        })
      }
      response.success(shopComments)
    }catch(err) {
      response.error(err)
    }
  }, function(err) {
    response.error(err)
  })
}

function fetchShopCommentReplyList(request, response) {
  var shopCommentId = request.params.shopCommentId
  var query = new AV.Query('ShopCommentReply')
  var shopComment = AV.Object.createWithoutData('ShopComment', shopCommentId)
  query.equalTo('replyShopComment', shopComment)
  query.include(['user', 'parentReply', 'parentReply.user'])
  query.addAscending('createdAt')
  query.equalTo('status', 1)

  return query.find().then(function(results){
    var replys = shopUtil.shopCommentReplyFromLeancloudObject(results)
    response.success(replys)
  }, function(err) {
    response.error(err)
  })
}

function fetchShopCommentUpedUserList(request, response) {
  var shopCommentId = request.params.shopCommentId
  var query = new AV.Query('ShopCommentUp')
  var shopComment = AV.Object.createWithoutData('ShopComment', shopCommentId)
  query.equalTo('targetShopComment', shopComment)
  query.include(['user'])
  query.addAscending('createdAt')

  return query.find().then(function(results){
    var upedUsersList = shopUtil.shopCommentUpFromLeancloudObject(results)
    response.success(upedUsersList)
  }, function(err) {
    response.error(err)
  })
}

/**
 * 店铺注册认证
 * @param request
 * @param response
 */
function shopCertificate(request, response) {
  var inviteCode = request.params.inviteCode
  var phone = request.params.phone
  var shopName = request.params.shopName
  var shopAddress = request.params.shopAddress
  var geo = request.params.geo
  var geoProvince = request.params.geoProvince
  var geoProvinceCode = request.params.geoProvinceCode
  var geoCityCode = request.params.geoCityCode
  var geoDistrictCode = request.params.geoDistrictCode
  var geoCity = request.params.geoCity
  var geoDistrict = request.params.geoDistrict

  var currentUser = request.currentUser
  if(!currentUser) {
    var userId = request.params.userId
    if(userId) {
      currentUser = AV.Object.createWithoutData('_User', userId)
    }else{
      response.error({
        errcode: 1,
        message: '获取用户信息失败',
      })
      return
    }
  }

  var existQuery = new AV.Query('Shop')
  existQuery.equalTo('owner', currentUser)
  existQuery.first().then((shop) => {
    if (shop) {
      response.error({
        errcode: 1,
        message: '该用户已有店铺，不能重复注册',
      })
    } else {
      inviteCodeFunc.verifyCode(inviteCode).then(function(reply){
        if (!reply) {
          response.error({
            errcode: 1,
            message: '邀请码无效，请向推广员重新获取邀请码',
          })
          return
        }

        var inviterId = reply

        var Shop = AV.Object.extend('Shop')
        var shop = new Shop()
        var inviter = AV.Object.createWithoutData('_User', inviterId)

        shop.set('phone', phone + '')
        shop.set('shopName', shopName + '')
        shop.set('shopAddress', shopAddress + '')
        if(geo) {
          var geoArr = geo.split(',')
          var latitude = parseFloat(geoArr[0])
          var longitude = parseFloat(geoArr[1])
          var numberGeoArr = [latitude, longitude]
          var point = new AV.GeoPoint(numberGeoArr)
          shop.set('geo', point)
        }
        shop.set('geoProvince', geoProvince + '')
        shop.set('geoProvinceCode', geoProvinceCode + '')
        shop.set('geoCity', geoCity + '')
        shop.set('geoCityCode', geoCityCode + '')
        shop.set('geoDistrict', geoDistrict + '')
        shop.set('geoDistrictCode', geoDistrictCode + '')
        shop.set('owner', currentUser)
        shop.set('inviter', inviter)
        currentUser.addUnique('identity', IDENTITY_SHOPKEEPER)

        var savePromoter = PromoterFunc.getPromoterByUserId(inviterId).then((upPromoter) => {
          console.log('getPromoterByUserId shop invite promoter id is: ', upPromoter.id)
          PromoterFunc.incrementInviteShopNum(upPromoter.id)
        }, (reason) => {
          console.log('getPromoterByUserId.reason====', reason)
          return reason
        })

        Promise.all([currentUser.save(), savePromoter]).then(() => {
          return shop.save()
        }).then((shopInfo) => {
          response.success({
            errcode: 0,
            message: '店铺注册认证成功',
            shopInfo: shopInfo
          })
        }, function(reason) {
          console.log('shopCertificate.Promise.all.reason====', reason)
          response.error({
            errcode: 1,
            message: '店铺注册认证失败，请与客服联系',
          })
        }).catch((err) => {
          console.log('shopCertificate.Promise.all.catch.err====', err)
          response.error({
            errcode: 1,
            message: '店铺注册认证失败，请与客服联系',
          })
        })
      }, function(reason) {
        console.log("shopCertificate.verifyCode.reason====", reason)
        response.error({
          errcode: 1,
          message: '邀请码校验失败，请重新获取'
        })
      }).catch(function(error){
        console.log("shopCertificate.verifyCode.catch.error====", error)
        response.error({
          errcode: 1,
          message: '邀请码校验失败，请重新获取',
        })
      })
    }
  }, (err) => {
    console.log('query exist shop error: ', err)
    response.error({
      errcode: 1,
      message: '配置'
    })
  })
}

function unregistShop(request, response) {
  var shopId = request.params.shopId
  var currentUser = request.currentUser
  if(!shopId || !currentUser) {
    response.error({
      errcode: 1,
      message: '店铺id为空或用户为登陆'
    })
  }else{
    var shop = AV.Object.createWithoutData('Shop', shopId)
    shop.set('status', 2)

    var user = AV.Object.createWithoutData('_User', currentUser.id)
    user.remove('identity', IDENTITY_SHOPKEEPER)

    Promise.all([shop.save(), user.save()]).then(()=>{
        response.success({
          errcode: 0,
          message: '注销店铺成功',
        })
    }, (reason)=>{
      console.log('unregistShop.reason==>>', reason)
      response.error({
        errcode: 1,
        message: '注销店铺失败，请稍后再试',
      })
    }).catch((error) => {
      console.log('unregistShop.error==>>', error)
      response.error({
        errcode: 1,
        message: '注销店铺网络异常，请稍后再试',
      })
    })

  }
  
}

/**
 * 获取店铺注册邀请人
 * @param request
 * @param response
 */
function getShopInviter(request, response) {
  response.success({
    errcode: 0,
    message: '接口暂未实现',
  })
}

function getShopPromotionMaxNum(request, response) {

  redisUtils.getAsync(systemConfigNames.SHOP_PROMOTION_MAX_NUM).then((shopPromotionMaxNum)=>{
    // console.log('redisUtils.getAsync.shopPromotionMaxNum===', shopPromotionMaxNum)

    if(!shopPromotionMaxNum || shopPromotionMaxNum < 0) {
      var query = new AV.Query('SystemConfig')
      query.equalTo('cfgName', systemConfigNames.SHOP_PROMOTION_MAX_NUM)
      query.first().then((result)=>{
        shopPromotionMaxNum = parseInt(result.attributes.cfgValue)
        // console.log('redisUtils.query.shopPromotionMaxNum===', shopPromotionMaxNum)
        redisUtils.setAsync(systemConfigNames.SHOP_PROMOTION_MAX_NUM, shopPromotionMaxNum)
        response.success({
          errcode: '0',
          message: shopPromotionMaxNum
        })
      }, (error)=>{
        response.error({
          errcode: '-1',
          message: error.message || '网络异常'
        })
      })
    }else{
      response.success({
        errcode: '0',
        message: shopPromotionMaxNum
      })
    }
  }, (error)=>{
    response.error({
      errcode: '-1',
      message: error.message || '网络异常'
    })
  })
  
}

/**
 * 根据店铺id获取店铺信息
 * @param shopId  店铺id
 * @param includeOwner 是否同时获取店主信息
 * @returns {*}
 */
function getShopById(shopId, includeOwner) {
  var query = new AV.Query('Shop')
  if (!includeOwner) {
    includeOwner = false
  }
  if (includeOwner) {
    query.include('owner')
  }
  return query.get(shopId)
}

function fetchShopFollowers(request, response) {
  var isRefresh = request.params.isRefresh
  var lastCreatedAt = request.params.lastCreatedAt
  var shopId = request.params.shopId

  var shop = AV.Object.createWithoutData('Shop', shopId)

  var query = new AV.Query('ShopFollower')

  query.equalTo('shop', shop)
  query.include(['follower'])
  query.addDescending('createdAt')
  query.limit(5) // 最多返回 5 条结果

  if(!isRefresh) { //分页查询
    if(!lastCreatedAt) {
      response.error({
        code: -3,
        message: 'lastCreatedAt为空'
      })
      return
    }
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  return query.find().then(function(results) {
    // console.log('_Followee.results====', results)

    try{
      var shopFollowers = []

      if(results && results.length) {
        var shopOrQueryArr = []
        var topicOrQueryArr = []
        var followerQueryArr = []

        results.forEach((item, index) => {
          var attrs = item.attributes
          var follower = attrs.follower
          var userInfo = authUtils.userInfoFromLeancloudObject(follower)
          shopFollowers.push(userInfo)

          var owner = AV.Object.createWithoutData('_User', userInfo.id)

          var shopQuery = new AV.Query('Shop')
          shopQuery.equalTo('owner', owner)
          shopQuery.equalTo('status', 1)
          shopOrQueryArr.push(shopQuery)
     
          var topicQuery = new AV.Query('Topics')
          topicQuery.equalTo('user', owner)
          topicQuery.equalTo('status', 1)
          topicQuery.addDescending('createdAt')
          topicQuery.limit(1)//最新发布的话题
          
          topicOrQueryArr.push(topicQuery.find())

          var followerQuery = new AV.Query('_Follower')
          followerQuery.equalTo('user', owner)
          followerQueryArr.push(followerQuery.count())
        })

        var shopOrQuery = AV.Query.or.apply(null, shopOrQueryArr)
        shopOrQuery.include(['targetShopCategory', 'inviter', 'containedTag', 'containedPromotions'])

        shopOrQuery.find().then((shopLcInfos)=>{
          // console.log('shopOrQuery...shopLcInfos=====', shopLcInfos)
          var shopInfos = shopUtil.shopFromLeancloudObject(shopLcInfos)
          authUtils.userInfosConcatShopInfo(shopFollowers, shopInfos)
          // console.log('shopOrQuery...shopFollowers=====', shopFollowers)

          Promise.all(topicOrQueryArr).then((topicLcInfos)=>{
            // console.log('topicLcInfos===************', topicLcInfos)
            var topicInfos = []
            if(topicLcInfos && topicLcInfos.length) {
              topicLcInfos.forEach((topicLcInfo)=>{
                var topicInfo = authUtils.topicInfoFromLeancloudObject(topicLcInfo[0])
                topicInfos.push(topicInfo)
              })
              authUtils.userInfosConcatTopicInfo(shopFollowers, topicInfos)
            }

            Promise.all(followerQueryArr).then((followersCounts)=>{
              // console.log('followersCounts====', followersCounts)
              shopFollowers.forEach((item, index)=>{
                item.followersCounts = followersCounts[index]
              })

              response.success({
                code: 0,
                message: '成功',
                shopFollowers: shopFollowers,
              })
            }, (err)=>{
              console.log('followerQueryArr===err=', err)
              response.success({
                code: 0,
                message: '成功',
                shopFollowers: shopFollowers,
              })
            })

          }, (err)=>{
            console.log('topicOrQueryArr===err=', err)
            response.success({
              code: 0,
              message: '成功',
              shopFollowers: shopFollowers,
            })
          })

        }, (err)=>{
          console.log('shopOrQuery===', err)

          response.success({
            code: 0,
            message: '成功',
            shopFollowers: shopFollowers,
          })
        })

      }else {
        response.success({
          code: 0,
          message: '成功',
          shopFollowers: shopFollowers
        })
      }
      
    }catch(error) {
      response.error({
        code: -2,
        message: err.message || '失败'
      })
    }

  }, function(err) {
    response.error({
      code: -1,
      message: err.message || '失败'
    })
  })
}

function updateShopLocationInfo(request, response) {
  // console.log('updateShopLocationInfo.request.params=====', request.params)

  var shopId = request.params.shopId;

  var province = request.params.province;
  var provinceCode = request.params.provinceCode;

  var city = request.params.city;
  var cityCode = request.params.cityCode;

  var district = request.params.district;
  var districtCode = request.params.districtCode;

  var latitude = request.params.latitude;
  var longitude = request.params.longitude;
  var geoPoint = null
  if(latitude && longitude) {
    geoPoint = new AV.GeoPoint([parseFloat(latitude), parseFloat(longitude)])
  }

  var shop = AV.Object.createWithoutData('Shop', shopId)
  if(province) {
    shop.set('geoProvince', province + "")
    shop.set('geoProvinceCode', provinceCode + "")
  }
  if(city) {
    shop.set('geoCity', city + "")
    shop.set('geoCityCode', cityCode + "")
  }
  if(district) {
    shop.set('geoDistrict', district + "")
    shop.set('geoDistrictCode', districtCode + "")
  }

  if(geoPoint) {
    shop.set('geo', geoPoint)
  }

  return shop.save().then(function(result){
    response.success(result)
  }, function(error){
    console.log('updateShopLocationInfo.error====', error)
    response.error('update fail', error)
  })
}

function updateShopInfoAfterPaySuccessCloud(request, response) {
  var shopId = request.params.shopId;
  var tenant = request.params.tenant;
  if(!shopId || !tenant) {
    response.error({
      code: -1,
      message: 'shopId or tenant is null'
    })
    return
  }

  var shop = AV.Object.createWithoutData('Shop', shopId)
  shop.set('tenant', tenant)
  shop.set('payment', 1)

  return shop.save().then(function(result){
    response.success({
      code: 0,
      message: 'success'
    })
  }, function(error){
    response.error({
      code: -1,
      message: 'update fail'
    })
    console.log('updateShopInfoAfterPaySuccessCloud.error====', error)
  })
}

function updateShopInfoAfterPaySuccess(shopId, tenant) {
  if(!shopId || !tenant) {
    return false
  }

  var shop = AV.Object.createWithoutData('Shop', shopId)
  shop.set('tenant', tenant)
  shop.set('payment', 1)

  return shop.save().then(function(result){
    return true
  }, function(error){
    console.log('updateShopInfoAfterPaySuccess.error====', error)
    return false
  })
}

/**
 * 根据用户id获取其店铺信息
 * @param userId
 * @returns {*}
 */
function getShopByUserId(userId) {
  var userQuery = new AV.Query('_User')
  var query = new AV.Query('Shop')

  return userQuery.get(userId).then((user) => {
    query.equalTo('owner', user)
    return query.first()
  })
}

function getShopPromotionById(shopPromotionId) {
  var query = new AV.Query('ShopPromotion')

  return query.get(shopPromotionId).then((result) => {
    var shop = result.attributes
    return {
      title: shop.title,
      coverUrl: shop.coverUrl,
      abstract: shop.abstract,
      type: shop.type,
      originalPrice: shop.originalPrice,
      promotingPrice: shop.promotingPrice,
      promotionDetailInfo: shop.promotionDetailInfo
    }
  }).catch((error) => {
    console.log(error)
    return undefined
  })
}

/**
 * 通过shopPromotionId创建分享链接
 * @param shopPromotionId
 */
function shareShopPromotionById(request, response) {
  var id = request.params.shopPromotionId

  getShopPromotionById(id).then((result) => {
    var shopPromotion = {
      title: result.title,
      coverUrl: result.coverUrl,
      content: JSON.parse(result.promotionDetailInfo),
    }
    var str = fs.readFileSync(__dirname + '/shopPromotionShare.ejs', 'utf8')
    var template = ejs.compile(str)
    var shareHtml = template(shopPromotion)
    var buffer = new Buffer(shareHtml).toString('base64')
    var data = { base64: buffer }

    var file = new AV.File("shopPromotion_shareId" + id, data, 'text/html')
    return file.save()
  }).then((savedFile) => {
    if(savedFile.attributes.url) {
      response.success({
        url: savedFile.attributes.url
      })
      return
    }
    response.error({
      errorCode: 1,
      message: "share html file save failed!"
    })
  }).catch((error) => {
    // console.log(error)
    response.error(error)
  })

}

var shopFunc = {
  constructShopInfo: constructShopInfo,
  fetchShopCommentList: fetchShopCommentList,
  fetchShopCommentReplyList: fetchShopCommentReplyList,
  fetchShopCommentUpedUserList: fetchShopCommentUpedUserList,
  shopCertificate: shopCertificate,
  getShopInviter: getShopInviter,
  getShopPromotionMaxNum: getShopPromotionMaxNum,
  unregistShop: unregistShop,
  getShopById: getShopById,
  fetchShopFollowers: fetchShopFollowers,
  updateShopLocationInfo: updateShopLocationInfo,
  updateShopInfoAfterPaySuccess: updateShopInfoAfterPaySuccess,
  updateShopInfoAfterPaySuccessCloud: updateShopInfoAfterPaySuccessCloud,
  getShopByUserId: getShopByUserId,
  shareShopPromotionById: shareShopPromotionById,
}

module.exports = shopFunc