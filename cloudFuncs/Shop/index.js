/**
 * Created by zachary on 2017/01/04.
 */

var Promise = require('bluebird')
var AV = require('leanengine');
var shopUtil = require('../../utils/shopUtil');
var inviteCodeFunc = require('../util/inviteCode')
var IDENTITY_SHOPKEEPER = require('../../constants/appConst').IDENTITY_SHOPKEEPER
var PromoterFunc = require('../Promoter')


function fetchShopCommentList(request, response) {
  var shopId = request.params.id
  var isRefresh = request.params.isRefresh
  var lastCreatedAt = request.params.lastCreatedAt

  var query = new AV.Query('ShopComment')

  if(!isRefresh) { //分页查询
    if(!lastCreatedAt) {
      console.log('分页查询分页查询分页查询分页查询')
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
  return query.find().then(function(results) {
    console.log('shopComments==', results)
    try{
      var shopComments = shopUtil.shopCommentFromLeancloudObject(results)

      if(shopComments && shopComments.length) {
        var queryArr = []
        var upQueryArr = []
        shopComments.forEach(function(item, index){
          var replyQuery = new AV.Query('ShopCommentReply')
          var shopComment = AV.Object.createWithoutData('ShopComment', item.id)
          replyQuery.equalTo('replyShopComment', shopComment)
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
  // console.log('shopCertificate====', request.params)
  var inviteCode = request.params.inviteCode
  inviteCodeFunc.verifyCode(inviteCode).then(function(reply){
    if (!reply) {
      response.error({
        errcode: 1,
        message: '邀请码无效，请向推广员重新获取邀请码',
      })
      return
    }
    var currentUser = request.currentUser
    var name = request.params.name
    var phone = request.params.phone
    var shopName = request.params.shopName
    var shopAddress = request.params.shopAddress
    var geo = request.params.geo
    var geoCity = request.params.geoCity
    var geoDistrict = request.params.geoDistrict
    var certification = request.params.certification
    var inviterId = reply


    var Shop = AV.Object.extend('Shop')
    var shop = new Shop()
    var inviter = AV.Object.createWithoutData('_User', inviterId)

    shop.set('name', name + '')
    shop.set('phone', phone + '')
    shop.set('shopName', shopName + '')
    shop.set('shopAddress', shopAddress + '')
    if(geo) {
      var point = new AV.GeoPoint(geo)
      shop.set('geo', point)
    }
    shop.set('geoCity', geoCity + '')
    shop.set('geoDistrict', geoDistrict + '')
    shop.set('owner', currentUser)
    shop.set('certification', certification + '')
    shop.set('inviter', inviter)
    currentUser.addUnique('identity', IDENTITY_SHOPKEEPER)
    // console.log('shop========', shop)
    shop.save().then(function(shopInfo){
      currentUser.save().then(function(){
        // console.log('shopCertificate==success==')
        PromoterFunc.incrementInviteShopNum(inviterId)
        response.success({
          errcode: 0,
          message: '店铺注册认证成功'
        })
      }, function(error){
        var shopObj = AV.Object.createWithoutData('Shop', shopInfo.id)
        shopObj.destroy()
        // console.log("shopCertificate.save===", error)
        console.log(error)
        response.error({
          errcode: 1,
          message: '店铺注册认证失败，请与客服联系',
        })
      })
    }, function(error){
      // console.log("shopCertificate.shop.save===", error)
      console.log(error)
      response.error({
        errcode: 1,
        message: '店铺注册认证失败，请与客服联系',
      })
    })

    // Promise.all([currentUser.save(), shop.save()]).then(() => {
    //   console.log('shopCertificate==success==')
    //   PromoterFunc.incrementInviteShopNum(inviterId)
    //   response.success({
    //     errcode: 0,
    //     message: '店铺注册认证成功'
    //   })

    // }).catch((error) => {
    //   console.log("shopCertificate", error)
    //   console.log(error)
    //   response.error({
    //     errcode: 1,
    //     message: '店铺注册认证失败，请与客服联系',
    //   })
    // })
  }).catch(function(error){
    console.log("shopCertificate.verifyCode====", error)
    response.error({
      errcode: 1,
      message: '邀请码校验失败，请重新获取',
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
  response.success({
    errcode: 0,
    message: 3
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

var shopFunc = {
  fetchShopCommentList: fetchShopCommentList,
  fetchShopCommentReplyList: fetchShopCommentReplyList,
  fetchShopCommentUpedUserList: fetchShopCommentUpedUserList,
  shopCertificate: shopCertificate,
  getShopInviter: getShopInviter,
  getShopPromotionMaxNum: getShopPromotionMaxNum,
  unregistShop: unregistShop,
  getShopById: getShopById
}

module.exports = shopFunc