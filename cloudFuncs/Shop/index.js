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
var fs = require('fs')

const CHINA_WIDTH = 5500.0      // 全国最大宽度
const shopPromotionMaxNum = 3   // 店铺最多活动数量
const promotionPayByDay = 10    // 店铺推广日费用


function constructShopInfo(leanShop) {
  if (!leanShop) {
    return undefined
  }
  var shop = {}
  var shopAttr = leanShop.attributes
  if (!shopAttr) {
    return undefined
  }
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
  if (shopAttr.containedTag && shopAttr.containedTag.length) {
    shopAttr.containedTag.forEach((item)=> {
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
  if (shopAttr.containedPromotions && shopAttr.containedPromotions.length) {
    shopAttr.containedPromotions.forEach((promotion)=> {
      var promotionRecord = constructShopPromotion(promotion, false)
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

function constructShopPromotion(leanPromotion, showUser) {
  var constructUserInfo = require('../Auth').constructUserInfo
  if (!leanPromotion) {
    return undefined
  }
  var prompAttr = leanPromotion.attributes
  if (!prompAttr) {
    return undefined
  }
  var promotion = {}
  promotion.id = leanPromotion.id
  promotion.coverUrl = prompAttr.coverUrl
  promotion.typeId = prompAttr.typeId
  promotion.type = prompAttr.type
  promotion.typeDesc = prompAttr.typeDesc
  promotion.title = prompAttr.title
  promotion.abstract = prompAttr.abstract
  promotion.promotingPrice = prompAttr.promotingPrice
  promotion.originalPrice = prompAttr.originalPrice
  promotion.status = prompAttr.status
  promotion.promotionDetailInfo = prompAttr.promotionDetailInfo
  promotion.geo = prompAttr.geo

  var targetShop = {}
  if (prompAttr.targetShop) {
    var targetShopAttr = prompAttr.targetShop.attributes
    targetShop.id = prompAttr.targetShop.id
    targetShop.shopName = targetShopAttr.shopName
    targetShop.geoDistrict = targetShopAttr.geoDistrict
    targetShop.geo = targetShopAttr.geo
    if (showUser) {
      targetShop.owner = constructUserInfo(targetShopAttr.owner)
    }
  } else {
    targetShop = undefined
  }

  promotion.targetShop = targetShop

  promotion.createdAt = leanPromotion.createdAt
  promotion.updatedAt = leanPromotion.updatedAt

  return promotion
}

function getShopById(shopId) {
  var query = new AV.Query('Shop')
  return query.get(shopId)
}

function fetchShopCommentList(request, response) {
  var shopId = request.params.id
  var isRefresh = request.params.isRefresh
  var lastCreatedAt = request.params.lastCreatedAt

  var query = new AV.Query('ShopComment')

  if (!isRefresh) { //分页查询
    if (!lastCreatedAt) {
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
  return query.find().then(function (results) {
    try {
      var shopComments = shopUtil.shopCommentFromLeancloudObject(results)

      if (shopComments && shopComments.length) {
        var queryArr = []
        var upQueryArr = []
        shopComments.forEach(function (item, index) {
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

        return orQuery.find().then(function (orResults) {
          var replys = shopUtil.shopCommentReplyFromLeancloudObject(orResults)
          shopUtil.shopCommentsConcatReplys(shopComments, replys)

          var upOrQuery = AV.Query.or.apply(null, upQueryArr)
          upOrQuery.include(['user'])
          upOrQuery.addAscending('createdAt')
          // console.log('orResults==========', orResults)

          return upOrQuery.find().then(function (upOrResults) {
            try {
              // console.log('upOrResults==========', upOrResults)
              var ups = shopUtil.shopCommentUpFromLeancloudObject(upOrResults)
              // console.log('shopCommentUpFromLeancloudObject==========')
              shopUtil.shopCommentsConcatUps(shopComments, ups)
              // console.log('shopCommentsConcatUps==========')
              response.success(shopComments)
            } catch (err) {
              console.log('err==========', err)
            }
          }, function (upErr) {
            response.success(shopComments)
          })

        }, function (err) {
          response.success(shopComments)
        })
      }
      response.success(shopComments)
    } catch (err) {
      response.error(err)
    }
  }, function (err) {
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

  return query.find().then(function (results) {
    var replys = shopUtil.shopCommentReplyFromLeancloudObject(results)
    response.success(replys)
  }, function (err) {
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

  return query.find().then(function (results) {
    var upedUsersList = shopUtil.shopCommentUpFromLeancloudObject(results)
    response.success(upedUsersList)
  }, function (err) {
    response.error(err)
  })
}

/**
 * 店铺注册认证（老接口，app更新后修养废弃）
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
  if (!currentUser) {
    var userId = request.params.userId
    if (userId) {
      currentUser = AV.Object.createWithoutData('_User', userId)
    } else {
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
      inviteCodeFunc.verifyCode(inviteCode).then(function (reply) {
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
        if (geo) {
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
        }, function (reason) {
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
      }, function (reason) {
        console.log("shopCertificate.verifyCode.reason====", reason)
        response.error({
          errcode: 1,
          message: '邀请码校验失败，请重新获取'
        })
      }).catch(function (error) {
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
      message: '注册店铺失败，请与客服联系'
    })
  }).catch((err) => {
    console.log('shop regist error: ', err)
    response.error({
      errcode: 1,
      message: '注册店铺失败，请与客服联系'
    })
  })
}


/**
 * 店铺注册认证(新接口：店铺邀请者信息通过Promoter表来指定)
 * @param request
 * @param response
 */
function shopCertificateNew(request, response) {

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
  if (!currentUser) {
    var userId = request.params.userId
    if (userId) {
      currentUser = AV.Object.createWithoutData('_User', userId)
    } else {
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
      var query = new AV.Query('Promoter')
      query.equalTo('user', currentUser)
      query.first().then((promoter) => {
        return PromoterFunc.getUpPromoter(promoter, false)
      }).then((upPromoter) => {
        var Shop = AV.Object.extend('Shop')
        var shop = new Shop()

        shop.set('phone', String(phone))
        shop.set('shopName', String(shopName))
        shop.set('shopAddress', String(shopAddress))
        console.log("geo", geo)
        if (geo) {
          var geoArr = geo.split(',')
          var latitude = parseFloat(geoArr[0])
          var longitude = parseFloat(geoArr[1])
          var numberGeoArr = [latitude, longitude]
          var point = new AV.GeoPoint(numberGeoArr)
          shop.set('geo', point)
        }
        shop.set('geoProvince', String(geoProvince))
        shop.set('geoProvinceCode', String(geoProvinceCode))
        shop.set('geoCity', String(geoCity))
        shop.set('geoCityCode', String(geoCityCode))
        shop.set('geoDistrict', String(geoDistrict))
        shop.set('geoDistrictCode', String(geoDistrictCode))
        shop.set('owner', currentUser)
        if (upPromoter) {
          shop.set('inviter', upPromoter.attributes.user)
        }

        if (upPromoter) {
          PromoterFunc.incrementInviteShopNum(upPromoter.id).then(() => {
            return shop.save()
          }).then((shopInfo) => {
            response.success({
              errcode: 0,
              message: '店铺注册认证成功',
              shopInfo: shopInfo
            })
          }).catch((err) => {
            console.log(err)

            response.error({
              errcode: 1,
              message: '店铺注册认证失败，请与客服联系',
            })
          })
        } else {
          shop.save().then((shopInfo) => {
            response.success({
              errcode: 0,
              message: '店铺注册认证成功',
              shopInfo: shopInfo
            })
          }).catch((err) => {
            console.log(err)
            response.error({
              errcode: 1,
              message: '店铺注册认证失败，请与客服联系',
            })
          })
        }

      }).catch((error) => {
        console.log(error)
        response.error({
          errcode: 1,
          message: '店铺注册认证失败，请与客服联系',
        })
      })
    }
  }).catch((err) => {
    console.log(err)
    response.error({
      errcode: 1,
      message: '注册店铺失败，请与客服联系'
    })
  })
}


function unregistShop(request, response) {
  var shopId = request.params.shopId
  var currentUser = request.currentUser
  if (!shopId || !currentUser) {
    response.error({
      errcode: 1,
      message: '店铺id为空或用户为登陆'
    })
  } else {
    var shop = AV.Object.createWithoutData('Shop', shopId)
    shop.set('status', 2)

    var user = AV.Object.createWithoutData('_User', currentUser.id)
    user.remove('identity', IDENTITY_SHOPKEEPER)

    Promise.all([shop.save(), user.save()]).then(()=> {
      response.success({
        errcode: 0,
        message: '注销店铺成功',
      })
    }, (reason)=> {
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

  if (!isRefresh) { //分页查询
    if (!lastCreatedAt) {
      response.error({
        code: -3,
        message: 'lastCreatedAt为空'
      })
      return
    }
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  return query.find().then(function (results) {
    // console.log('_Followee.results====', results)

    try {
      var shopFollowers = []

      if (results && results.length) {
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

        shopOrQuery.find().then((shopLcInfos)=> {
          // console.log('shopOrQuery...shopLcInfos=====', shopLcInfos)
          var shopInfos = shopUtil.shopFromLeancloudObject(shopLcInfos)
          authUtils.userInfosConcatShopInfo(shopFollowers, shopInfos)
          // console.log('shopOrQuery...shopFollowers=====', shopFollowers)

          Promise.all(topicOrQueryArr).then((topicLcInfos)=> {
            // console.log('topicLcInfos===************', topicLcInfos)
            var topicInfos = []
            if (topicLcInfos && topicLcInfos.length) {
              topicLcInfos.forEach((topicLcInfo)=> {
                var topicInfo = authUtils.topicInfoFromLeancloudObject(topicLcInfo[0])
                topicInfos.push(topicInfo)
              })
              authUtils.userInfosConcatTopicInfo(shopFollowers, topicInfos)
            }

            Promise.all(followerQueryArr).then((followersCounts)=> {
              // console.log('followersCounts====', followersCounts)
              shopFollowers.forEach((item, index)=> {
                item.followersCounts = followersCounts[index]
              })

              response.success({
                code: 0,
                message: '成功',
                shopFollowers: shopFollowers,
              })
            }, (err)=> {
              console.log('followerQueryArr===err=', err)
              response.success({
                code: 0,
                message: '成功',
                shopFollowers: shopFollowers,
              })
            })

          }, (err)=> {
            console.log('topicOrQueryArr===err=', err)
            response.success({
              code: 0,
              message: '成功',
              shopFollowers: shopFollowers,
            })
          })

        }, (err)=> {
          console.log('shopOrQuery===', err)

          response.success({
            code: 0,
            message: '成功',
            shopFollowers: shopFollowers,
          })
        })

      } else {
        response.success({
          code: 0,
          message: '成功',
          shopFollowers: shopFollowers
        })
      }

    } catch (error) {
      response.error({
        code: -2,
        message: err.message || '失败'
      })
    }

  }, function (err) {
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
  if (latitude && longitude) {
    geoPoint = new AV.GeoPoint([parseFloat(latitude), parseFloat(longitude)])
  }

  var shop = AV.Object.createWithoutData('Shop', shopId)
  if (province) {
    shop.set('geoProvince', province + "")
    shop.set('geoProvinceCode', provinceCode + "")
  }
  if (city) {
    shop.set('geoCity', city + "")
    shop.set('geoCityCode', cityCode + "")
  }
  if (district) {
    shop.set('geoDistrict', district + "")
    shop.set('geoDistrictCode', districtCode + "")
  }

  if (geoPoint) {
    shop.set('geo', geoPoint)
  }

  return shop.save().then(function (result) {
      response.success(result)
  }, function (error) {
    console.log('updateShopLocationInfo.error====', error)
    response.error('update fail', error)
  })
}

function updateShopInfoAfterPaySuccessCloud(request, response) {
  var shopId = request.params.shopId;
  var tenant = request.params.tenant;
  if (!shopId || !tenant) {
    response.error({
      code: -1,
      message: 'shopId or tenant is null'
    })
    return
  }

  var shop = AV.Object.createWithoutData('Shop', shopId)
  shop.set('tenant', tenant)
  shop.set('payment', 1)

  return shop.save().then(function (result) {
    response.success({
      code: 0,
      message: 'success'
    })
  }, function (error) {
    response.error({
      code: -1,
      message: 'update fail'
    })
    console.log('updateShopInfoAfterPaySuccessCloud.error====', error)
  })
}

function updateShopInfoAfterPaySuccess(shopId, tenant) {
  if (!shopId || !tenant) {
    return false
  }

  var shop = AV.Object.createWithoutData('Shop', shopId)
  shop.set('tenant', tenant)
  shop.set('payment', 1)

  return shop.save().then(function (result) {
    return true
  }, function (error) {
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
    var data = {base64: buffer}

    var file = new AV.File("shopPromotion_shareId" + id, data, 'text/html')
    return file.save()
  }).then((savedFile) => {
    if (savedFile.attributes.url) {
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

/**
 * 更新所有店铺推广信息的地理位置，调试用!
 * @param request
 * @param response
 */
function modifyPromotionGeoPoint(request, response) {
  var query = new AV.Query('ShopPromotion')
  query.include('targetShop')
  query.each((promotion) => {
    var promotionId = promotion.id
    var shop = promotion.attributes.targetShop
    var geo = shop.attributes.geo
    var shopPromotion = AV.Object.createWithoutData('ShopPromotion', promotionId)
    shopPromotion.set('geo', geo)
    shopPromotion.save()
  })
  response.success({errcode: 0, message: 'ok'})
}

/**
 * 获取周边店铺推广信息
 * @param request
 * @param response
 */
function fetchNearbyShopPromotion(request, response) {
  var geo = request.params.geo
  var lastDistance = request.params.lastDistance
  var limit = request.params.limit || 20

  var query = new AV.Query('ShopPromotion')
  query.equalTo('status', "1")
  query.include(['targetShop', 'targetShop.owner'])
  query.limit(limit)

  var point = new AV.GeoPoint(geo)
  query.withinKilometers('geo', point, CHINA_WIDTH) // 全中国的最大距离

  if (lastDistance) {
    var notIncludeQuery = new AV.Query('ShopPromotion')
    notIncludeQuery.equalTo('status', "1")
    notIncludeQuery.withinKilometers('geo', point, lastDistance)
    query.doesNotMatchKeyInQuery('objectId', 'objectId', notIncludeQuery)
  }

  query.find().then((results) => {
    var promotions = []
    results.forEach((promp) => {
      promotions.push(constructShopPromotion(promp, true))
    })
    response.success({errcode: 0, promotions: promotions})
  }, (err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取附近店铺促销信息失败'})
  }).catch((err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取附近店铺促销信息失败'})
  })
}

/**
 * 获取周边店铺商品推广信息
 * @param request
 * @param response
 */
function fetchNearbyShopGoodPromotion(request, response) {
  var geo = request.params.geo
  var lastDistance = request.params.lastDistance
  var limit = request.params.limit || 20
  var nowDate = request.params.nowDate
  var query = new AV.Query('ShopGoodPromotion')
  query.equalTo('status', 1)
  query.include(['targetGood', 'targetShop'])
  query.limit(limit)

  var point = new AV.GeoPoint(geo)
  query.withinKilometers('geo', point, CHINA_WIDTH) // 全中国的最大距离

  if (lastDistance) {
    var notIncludeQuery = new AV.Query('ShopGoodPromotion')
    notIncludeQuery.equalTo('status', 1)
    notIncludeQuery.withinKilometers('geo', point, lastDistance)
    query.doesNotMatchKeyInQuery('objectId', 'objectId', notIncludeQuery)
  }
  // query.lessThanOrEqualTo('startDate', nowDate)
  query.greaterThanOrEqualTo('endDate', nowDate)
  query.find().then((results) => {
    var promotions = []
    results.forEach((promp) => {
      promotions.push(shopUtil.promotionFromLeancloudObject(promp, true))
    })
    response.success({errcode: 0, promotions: promotions})
  }, (err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取附近店铺促销信息失败'})
  }).catch((err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取附近店铺促销信息失败'})
  })
}

function submitCompleteShopInfo(request, response) {
  var payload = request.params.payload
  // var shop = request.params.shop
  var shop = AV.Object.createWithoutData('Shop', request.params.payload.shopId)
  var album = payload.album
  var coverUrl = payload.coverUrl

  var shopCategoryObjectId = payload.shopCategoryObjectId
  var openTime = payload.openTime
  var contactNumber = payload.contactNumber
  var contactNumber2 = payload.contactNumber2
  var ourSpecial = payload.ourSpecial

  var tagIds = payload.tagIds
  var targetShopCategory = null
  if (shopCategoryObjectId) {
    targetShopCategory = AV.Object.createWithoutData('ShopCategory', shopCategoryObjectId)
    shop.set('targetShopCategory', targetShopCategory)
  }

  var containedTag = []
  if (tagIds && tagIds.length) {
    tagIds.forEach((tagId) => {
      containedTag.push(AV.Object.createWithoutData('ShopTag', tagId))
    })
  }
  shop.set('containedTag', containedTag)
  if (coverUrl) {
    shop.set('coverUrl', coverUrl)
  }

  if (album && album.length) {
    shop.set('album', album)
  }

  shop.set('openTime', openTime)
  shop.set('contactNumber', contactNumber)
  shop.set('contactNumber2', contactNumber2)
  shop.set('ourSpecial', ourSpecial)
  // console.log('_submitCompleteShopInfo.shop====', shop)
  shop.save().then(function (shopInfo) {
    response.success({errcode: 0, goodsInfo: shopInfo})
  }, (err)=> {
    // console.log(err)
    response.error({errcode: 1, message: '店铺更新失败'})
  })
}

function submitEditShopInfo(request, response) {

  var payload = request.params.payload
  // var shop = request.params.shop
  var shop = AV.Object.createWithoutData('Shop', request.params.shop.shopId)
  var album = request.params.shop.album
  var coverUrl = request.params.shop.coverUrl
  var shopCategoryObjectId = payload.shopCategoryObjectId


  var openTime = payload.openTime
  var contactNumber = payload.contactNumber
  var contactNumber2 = payload.contactNumber2
  var ourSpecial = payload.ourSpecial
  var tagIds = payload.tagIds
  var shopName = payload.shopName
  var shopAddress = payload.shopAddress
  var geo = payload.geo
  var geoCity = payload.geoCity
  var geoDistrict = payload.geoDistrict

  var geoProvince = shop.geoProvince
  var geoProvinceCode = shop.geoProvinceCode
  var geoCityCode = shop.geoCityCode
  var geoDistrictCode = shop.geoDistrictCode
  var targetShopCategory = null
  var containedTag = []
  if (tagIds && tagIds.length) {
    tagIds.forEach((tagId) => {
      containedTag.push(AV.Object.createWithoutData('ShopTag', tagId))
    })
  }

  if (shopCategoryObjectId) {
    targetShopCategory = AV.Object.createWithoutData('ShopCategory', shopCategoryObjectId)
    shop.set('targetShopCategory', targetShopCategory)
  }

  shop.set('shopName', shopName)
  shop.set('shopAddress', shopAddress)
  shop.set('containedTag', containedTag)
  shop.set('openTime', openTime)
  shop.set('contactNumber', contactNumber)
  shop.set('contactNumber2', contactNumber2)
  shop.set('ourSpecial', ourSpecial)
  if (album && album.length) {
    shop.set('album', album)
  }
  if (coverUrl) {
    shop.set('coverUrl', coverUrl)
  }
  var point = undefined
  if (geo) {
    var geoArr = geo.split(',')
    var latitude = parseFloat(geoArr[0])
    var longitude = parseFloat(geoArr[1])
    var numberGeoArr = [latitude, longitude]
    point = new AV.GeoPoint(numberGeoArr)
    shop.set('geo', point)
  }
  shop.set('geoProvince', geoProvince)
  shop.set('geoCity', geoCity)
  shop.set('geoDistrict', geoDistrict)
  shop.set('geoProvinceCode', geoProvinceCode)
  shop.set('geoCityCode', geoCityCode)
  shop.set('geoDistrictCode', geoDistrictCode)

  // console.log('_submitEditShopInfo.payload===', payload)
  // console.log('_submitEditShopInfo.shop===', shop)
  shop.save().then((shopInfo)=> {
    // console.log('new ShopInfo:', shopInfo)
    if (geo) {
      var query = new AV.Query('ShopGoodPromotion')
      query.equalTo('targetShop', shop)
      query.find().then((promotions)=> {
        var localPromotions = []
        promotions.forEach((item)=> {
          item.set('geo', point)
        })
        return AV.Object.saveAll(promotions);
      }).then((promotionList)=>{
        response.success({errcode: 0, goodsInfo: shopInfo})
      },(error)=>{
        response.error({errcode: 1, message: '店铺更新失败'})
      })
    }else {
      response.success({errcode: 0, goodsInfo: shopInfo})
    }
  }, (err)=> {
    // console.log(err)
    response.error({errcode: 1, message: '店铺更新失败'})
  })
}

function fetchNearbyShops(request, response) {
  var shopCategoryId = request.params.shopCategoryId
  var shopTagId = request.params.shopTagId
  var geo = request.params.geo
  var lastDistance = request.params.lastDistance
  var sortId = request.params.sortId // 0-智能,1-按好评,2-按距离;3-按等级(grade)
  var distance = request.params.distance
  var limit = request.params.limit || 30

  var query = new AV.Query('Shop')
  query.equalTo('status', 1)
  query.equalTo('payment', 1)
  query.exists('coverUrl')
  query.limit(limit)

  if (shopCategoryId) {
    var targetShopCategory = AV.Object.createWithoutData('ShopCategory', shopCategoryId)
    query.equalTo('targetShopCategory', targetShopCategory)
  }

  if (shopTagId) {
    var shopTag = AV.Object.createWithoutData('ShopTag', shopTagId)
    query.equalTo('containedTag', shopTag)
  }

  if (!distance) {
    distance = CHINA_WIDTH      // 全中国的最大距离
  }

  var point = new AV.GeoPoint(geo)
  query.withinKilometers('geo', point, distance)

  if (lastDistance) {
    var notIncludeQuery = new AV.Query('Shop')
    notIncludeQuery.withinKilometers('geo', point, lastDistance)
    notIncludeQuery.equalTo('status', 1)
    notIncludeQuery.equalTo('payment', 1)
    notIncludeQuery.exists('coverUrl')
    if (shopCategoryId) {
      var notTargetShopCategory = AV.Object.createWithoutData('ShopCategory', shopCategoryId)
      notIncludeQuery.equalTo('targetShopCategory', notTargetShopCategory)
    }

    if (shopTagId) {
      var notShopTag = AV.Object.createWithoutData('ShopTag', shopTagId)
      notIncludeQuery.equalTo('containedTag', notShopTag)
    }
    notIncludeQuery.select(['objectId'])
    query.doesNotMatchKeyInQuery('objectId', 'objectId', notIncludeQuery)
  }

  //用 include 告知服务端需要返回的关联属性对应的对象的详细信息，而不仅仅是 objectId
  query.include(['targetShopCategory', 'owner', 'containedTag', 'containedPromotions'])

  query.find().then((results) => {
    var shops = []
    results.forEach((shop) => {
      shops.push(constructShopInfo(shop))
    })
    response.success({errcode: 0, shops: shops})
  }, (err) => {
    console.log('error in fetchNearbyShops: ', err)
    response.error({errcode: 1, shops: [], message: '获取店铺信息失败'})
  }).catch((err) => {
    console.log('error in fetchNearbyShops: ', err)
    response.error({errcode: 1, shops: [], message: '获取店铺信息失败'})
  })
}

function submitShopPromotion(request, response) {
  // console.log('submitShopPromotion.payload===', payload)
  var payload = request.params.payload
  var goodId = payload.goodId
  var status = payload.status
  var startDate = payload.startDate
  var endDate = payload.endDate
  var shopId = payload.shopId
  var typeId = payload.typeId
  var type = payload.type
  var typeDesc = payload.typeDesc
  var promotionPrice = payload.price
  var abstract = payload.abstract
  var geo = payload.geo

  var ShopPromotion = AV.Object.extend('ShopGoodPromotion')
  var shopPromotion = new ShopPromotion()
  if (goodId) {
    var good = AV.Object.createWithoutData('ShopGoods', goodId)
    shopPromotion.set('targetGood', good)
  }
  var shop = null
  if (shopId) {
    shop = AV.Object.createWithoutData('Shop', shopId)
    shopPromotion.set('targetShop', shop)

  }
  shopPromotion.set('startDate', startDate)
  shopPromotion.set('endDate', endDate)
  shopPromotion.set('typeId', typeId)
  shopPromotion.set('type', type)
  shopPromotion.set('typeDesc', typeDesc)
  shopPromotion.set('promotionPrice', promotionPrice)
  shopPromotion.set('abstract', abstract)
  shopPromotion.set('geo', geo)
  shopPromotion.set('status', status)
  shopPromotion.save().then((results) => {
    var good = AV.Object.createWithoutData('ShopGoods', goodId)
    var promotion = AV.Object.createWithoutData('ShopGoodPromotion', results.id)
    good.set('promotion', promotion)
    // console.log('shop/////>>>>>>>>>>', shop)
    good.save().then((result)=> {
      response.success()
      // console.log('rep---->>>>', rep)
    }, (error)=> {
      response.error(error)
      // console.log('error.........>>>>', error)
    })
  }, function (err) {
    response.error(err)
  })
}

function fetchOpenPromotionsByShopId(request, response) {
  var shopId = request.params.shopId
  var limit = request.params.limit || 20
  var query = new AV.Query('ShopGoodPromotion')
  var nowDate = request.params.nowDate
  var lastCreatedAt = request.params.lastCreatedAt
  var status = request.params.status
  query.equalTo('status', 1)
  query.include(['targetGood', 'targetShop'])
  query.limit(limit)
  if(lastCreatedAt){
    query.lessThan('createdAt',new Date(lastCreatedAt))
  }
  query.addDescending('createdAt')
  var shop = AV.Object.createWithoutData('Shop', shopId)
  query.equalTo('targetShop', shop)
  query.greaterThanOrEqualTo('endDate',nowDate)
  query.find().then((results) => {
    var promotions = []
    results.forEach((promp) => {
      promotions.push(shopUtil.promotionFromLeancloudObject(promp, true))
    })
    response.success({errcode: 0, promotions: promotions})
  }, (err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取启用活动失败'})
  }).catch((err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取启用活动失败'})
  })
}

function fetchCloPromotionsByShopId(request, response) {
  var shopId = request.params.shopId
  var limit = request.params.limit || 20
  var nowDate = request.params.nowDate
  var lastCreatedAt = request.params.lastCreatedAt
  var status = request.params.status
  var queryClo = new AV.Query('ShopGoodPromotion')
  queryClo.equalTo('status',0)
  var queryDat = new AV.Query('ShopGoodPromotion')
  queryDat.lessThanOrEqualTo('endDate',nowDate)
  var query =  AV.Query.or(queryClo,queryDat)
  query.include(['targetGood', 'targetShop'])
  query.limit(limit)
  var shop = AV.Object.createWithoutData('Shop', shopId)
  query.equalTo('targetShop', shop)
  if(lastCreatedAt){
    query.lessThan('createdAt',new Date(lastCreatedAt))
  }
  query.addDescending('createdAt')
  query.find().then((results) => {
    var promotions = []
    results.forEach((promp) => {
      promotions.push(shopUtil.promotionFromLeancloudObject(promp, true))
    })
    response.success({errcode: 0, promotions: promotions})
  }, (err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取关闭活动失败'})
  }).catch((err) => {
    console.log('error in fetchNearbyShopPromotion: ', err)
    response.error({errcode: 1, message: '获取关闭活动失败'})
  })
}

function getShopPromotionMaxNum(request, response) {
  redisUtils.getAsync(systemConfigNames.SHOP_PROMOTION_MAX_NUM).then((shopPromotionMaxNumRedis)=> {
    if (!shopPromotionMaxNumRedis || shopPromotionMaxNumRedis < 0) {
      redisUtils.setAsync(systemConfigNames.SHOP_PROMOTION_MAX_NUM, shopPromotionMaxNum)
        response.success({
          errcode: '0',
          message: shopPromotionMaxNum
        })
      } else {
      response.success({
        errcode: '0',
        message: shopPromotionMaxNumRedis
      })
    }
  }, (error)=> {
    response.error({
      errcode: '-1',
      message: error.message || '网络异常'
    })
  })
}

function getShopPromotionDayPay(request, response) {
  redisUtils.getAsync(systemConfigNames.SHOP_PROMOTION_DAY_PAY).then((promotionDayPay)=> {
    if (!promotionDayPay || promotionDayPay < 0) {
      redisUtils.setAsync(systemConfigNames.SHOP_PROMOTION_MAX_NUM, promotionPayByDay)
      response.success({
        errcode: '0',
        message: promotionPayByDay
      })
    } else {
      response.success({
        errcode: '0',
        message: promotionDayPay
      })
    }
  }, (error)=> {
    response.error({
      errcode: '-1',
      message: error.message || '网络异常'
    })
  })
}

function closeShopPromotion(request,response){
  var promotionId = request.params.promotionId
  var promotion = AV.Object.createWithoutData('ShopGoodPromotion',promotionId)
  promotion.set('status',0)
  promotion.save().then((item)=>{
    var query= new AV.Query('ShopGoodPromotion')
    query.include(['targetShop','targetGood'])
    query.get(item.id).then((promotionInfo)=>{
      var promotion = shopUtil.promotionFromLeancloudObject(promotionInfo)
      response.success({errcode:'0',promotion:promotion})
    },(err)=>{
      response.error(err)
    })
  },(err)=>{
    response.error(err)
  })
}

function pubulishShopComment(request,response){
  var payload = request.params.payload
  var ShopComment = AV.Object.extend('ShopComment')
  var shopComment = new ShopComment()
  var shop = AV.Object.createWithoutData('Shop', payload.shopId)
  var user = AV.Object.createWithoutData('_User', payload.userId)
  var parentComment = undefined
  var replyComment = undefined
  shopComment.set('targetShop', shop)
  shopComment.set('user', user)
  shopComment.set('content', payload.content)
  shopComment.set('blueprints',payload.blueprints)
  if (payload.commentId&&payload.commentId!='') {
    parentComment = 	AV.Object.createWithoutData('ShopComment', payload.commentId)
    shopComment.set('parentComment', parentComment)
  }
  if(payload.replyId&&payload.replyId != ''){
    replyComment = 	AV.Object.createWithoutData('ShopComment', payload.replyId)
    shopComment.set('replyComment', replyComment)
  }

  shopComment.save().then((comment)=>{
    shop.increment("commentNum", 1)
    shop.save().then((shop)=>{
      if(payload.commentId&&payload.commentId!=''){
        parentComment.increment("commentCount",1)
        parentComment.save().then(()=>{
          var query = new AV.Query('ShopComment')
          query.include(['user']);
          query.include(['parentComment']);
          query.include(['parentComment.user']);
          query.include(['replyComment'])
          query.include(['replyComment.user'])
          query.get(comment.id).then((result)=>{
            var position = result.attributes.position
            var parentComment = result.attributes.parentComment
            var user = result.attributes.user
            var commentInfo = shopUtil.newShopCommentFromLeanCloudObject(result)
            response.success(commentInfo)
          },(err)=>{
            response.error(err)
          })
        },(err)=>{
          response.error(err)
        })
      }else{
        var query = new AV.Query('ShopComment')
        query.include(['user']);
        query.include(['parentComment']);
        query.include(['parentComment.user']);
        query.get(comment.id).then((result)=>{
          var commentInfo = shopUtil.newShopCommentFromLeanCloudObject(result)
          response.success(commentInfo)
        },(err)=>{
          response.error(err)
        })
      }
    },(err)=>{
      response.error(err)
    })
  },(err)=>{
    response.error(err)
  })

}

function fetchShopComments(request,response){
  var shopId = request.params.shopId
  var commentId = request.params.commentId
  var isRefresh = request.params.isRefresh;
  var lastCreatedAt = request.params.lastCreatedAt;
  var query = new AV.Query('ShopComment')

  if(shopId&&shopId!=''){
    var shop = AV.Object.createWithoutData('Shop', shopId)
    query.equalTo('targetShop', shop)
  }

  if(commentId&&commentId!=''){
    var comment = AV.Object.createWithoutData('ShopComment', commentId)
    query.equalTo('parentComment', comment)
  }

  // console.log('isRefresh====', isRefresh)
  // console.log('lastCreatedAt====', lastCreatedAt)
  if(!isRefresh && lastCreatedAt) { //分页查询
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  query.limit(10)

  query.include(['user']);
  query.include(['parentComment']);
  query.include(['parentComment.user']);
  query.include(['replyComment'])
  query.include(['replyComment.user'])

  query.descending('createdAt')
  query.find().then((results)=>{
    var topicCommentList = []
    var allComments = []
    var commentList = []
    results.forEach((result)=>{
      var position = result.attributes.position
      var parentComment = result.attributes.parentComment
      var replyComment = result.attributes.replyComment
      var user = result.attributes.user
      var shopComment = shopUtil.newShopCommentFromLeanCloudObject(result)
      // console.log('result===<',result.id)
      allComments.push(shopComment)
      commentList.push(shopComment.commentId)
    })
    response.success({allComments:allComments,commentList:commentList})
  },(err)=>{
    response.error(err)
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
  fetchNearbyShopPromotion: fetchNearbyShopPromotion,
  fetchNearbyShops: fetchNearbyShops,
  modifyPromotionGeoPoint: modifyPromotionGeoPoint,
  submitCompleteShopInfo: submitCompleteShopInfo,
  submitEditShopInfo: submitEditShopInfo,
  shopCertificateNew: shopCertificateNew,
  submitShopPromotion: submitShopPromotion,
  fetchNearbyShopGoodPromotion: fetchNearbyShopGoodPromotion,
  fetchOpenPromotionsByShopId: fetchOpenPromotionsByShopId,
  fetchCloPromotionsByShopId: fetchCloPromotionsByShopId,
  getShopPromotionDayPay: getShopPromotionDayPay,
  closeShopPromotion: closeShopPromotion,
  pubulishShopComment: pubulishShopComment,
  fetchShopComments: fetchShopComments

}

module.exports = shopFunc