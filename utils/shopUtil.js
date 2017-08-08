/**
 * Created by zachary on 2017/1/4.
 */

var numberUtils = require('./numberUtils');
var util = require('./util');

function shopFromLeancloudObject(results) {
  var shopInfos = []

  try{
    if(results && results.length) {
      results.forEach((item, index)=>{
        var shopInfo = {}
        shopInfo.id = item.id
        var createdAt = util.parseDate(item.createdAt)
        shopInfo.createdAt = createdAt.valueOf()
        shopInfo.createdDate = numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD HH:mm:SS')
        var updatedAt = util.parseDate(item.updatedAt)
        shopInfo.updatedAt = updatedAt.valueOf()
        shopInfo.updatedDate = numberUtils.formatLeancloudTime(updatedAt, 'YYYY-MM-DD HH:mm:SS')

        var attrs = item.attributes

        for(var key in attrs) {
          if('targetShopCategory' == key) {
            var targetShopCategoryInfo = {}
            var targetShopCategoryAttrs = attrs.targetShopCategory.attributes
            targetShopCategoryInfo.id = attrs.targetShopCategory.id
            targetShopCategoryInfo.shopCategoryId = targetShopCategoryAttrs.shopCategoryId
            targetShopCategoryInfo.text = targetShopCategoryAttrs.text

            shopInfo.targetShopCategory = targetShopCategoryInfo
          }else if('inviter' == key) {
            var inviterInfo = {}
            var inviterAttrs = attrs.inviter.attributes
            inviterInfo.id = attrs.inviter.id
            inviterInfo.avatar = inviterAttrs.avatar
            inviterInfo.nickname = inviterAttrs.nickname
            shopInfo.inviter = inviterInfo
          }else if('containedTag' == key) {
            var containedTagArr = []
            var containedTagLcArr = attrs.containedTag
            if(containedTagLcArr && containedTagLcArr.length) {
              containedTagLcArr.forEach((tag, index) =>{
                var tagInfo = {}
                var tagAttrs = tag.attributes
                tagInfo.id = tag.id
                tagInfo.name = tagAttrs.name
                containedTagArr.push(tagInfo)
              })
            }
            shopInfo.containedTag = containedTagArr
          }else if('containedPromotions' == key) {
            var containedPromotionsArr = []
            var containedPromotionsLcArr = attrs.containedPromotions
            if(containedPromotionsLcArr && containedPromotionsLcArr.length) {
              containedPromotionsLcArr.forEach((promotion, index) =>{
                var promotionInfo = {}
                var promotionAttrs = promotion.attributes
                promotionInfo.id = promotion.id
                for(var promotionKey in promotionAttrs) {
                  promotionInfo[promotionKey] = promotionAttrs[promotionKey]
                }
                containedPromotionsArr.push(promotionInfo)
              })
            }
            shopInfo.containedPromotions = containedPromotionsArr
          }else if (key == 'geo') {
            if(attrs.geo) {
              var geo = attrs.geo.toJSON()
              shopInfo.geo = [geo.latitude, geo.longitude]
            }else{
              shopInfo.geo = ''
            }
          }else if (key == 'owner') {
            var owner = {}
            owner.id = attrs.owner.id
            shopInfo.owner = owner
          }else {
            shopInfo[key] = attrs[key]
          }
        }

        shopInfos.push(shopInfo)

      })
    }
  }catch(error) {
    console.log('shopFromLeancloudObject...error====', error)
  }

  return shopInfos
}

function shopCommentFromLeancloudObject(results) {
  var shopComments = []
  if(results && results.length) {
    results.forEach(function(item, index) {
      var shopComment = {}
      shopComment.id = item.id
      var createdAt = util.parseDate(item.createdAt)
      shopComment.createdAt = createdAt.valueOf()
      shopComment.createdDate = numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD HH:mm:SS')
      shopComment.shopCommentTime = numberUtils.getConversationTime(createdAt.valueOf())
      var updatedAt = util.parseDate(item.updatedAt)
      shopComment.updatedAt = updatedAt.valueOf()

      var attrs = item.attributes
      shopComment.content = attrs.content
      shopComment.blueprints = attrs.blueprints
      shopComment.score = attrs.score
      shopComment.status = attrs.status

      var targetShop = {}
      var targetShopAttrs = attrs.targetShop.attributes
      if(targetShopAttrs) {
        targetShop.shopId = attrs.targetShop.id
        targetShop.shopName = targetShopAttrs.shopName
      }
      shopComment.targetShop = targetShop

      var user = {}
      var userAttrs = attrs.user && attrs.user.attributes
      if(userAttrs) {
        user.id = attrs.user.id
        user.nickname = userAttrs.nickname
        user.avatar = userAttrs.avatar
        user.username = userAttrs.username
      }
      shopComment.user = user
      shopComments.push(shopComment)
    })
  }
  return shopComments
}

function shopCommentReplyFromLeancloudObject(results) {
  var shopCommentReplys = []
  if(results && results.length) {
    results.forEach(function(item, index) {
      var shopCommentReply = {}
      shopCommentReply.id = item.id
      shopCommentReply.status= item.attributes.status
      var createdAt = util.parseDate(item.createdAt)
      shopCommentReply.createdAt = createdAt.valueOf()
      shopCommentReply.createdDate = numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD HH:mm:SS')
      shopCommentReply.shopCommentReplyTime = numberUtils.getConversationTime(createdAt.valueOf())
      var updatedAt = util.parseDate(item.updatedAt)
      shopCommentReply.updatedAt = updatedAt.valueOf()

      var attrs = item.attributes
      shopCommentReply.content = attrs.content
      shopCommentReply.replyShopCommentId = attrs.replyShopComment.id

      var user = {}
      var userAttrs = attrs.user && attrs.user.attributes
      if(userAttrs) {
        user.id = attrs.user.id
        user.nickname = userAttrs.nickname
        user.avatar = userAttrs.avatar
        user.username = userAttrs.username
      }
      shopCommentReply.user = user

      var parentReply = {}
      var parentReplyAttrs = attrs.parentReply && attrs.parentReply.attributes
      if(parentReplyAttrs) {
        parentReply.id = attrs.parentReply.id

        var _user = {}
        var parentReplyAttrsUserAttrs = parentReplyAttrs.user && parentReplyAttrs.user.attributes
        if(parentReplyAttrsUserAttrs) {
          _user.id = parentReplyAttrsUserAttrs.id
          _user.nickname = parentReplyAttrsUserAttrs.nickname
          _user.avatar = parentReplyAttrsUserAttrs.avatar
        }
        parentReply.user = _user
        shopCommentReply.parentReply = parentReply
      }
      shopCommentReplys.push(shopCommentReply)
    })
  }

  return shopCommentReplys
}

function shopCommentUpFromLeancloudObject(results) {
  var shopCommentUps = []
  if(results && results.length) {
    results.forEach(function(item, index){
      var shopCommentUp = {}
      shopCommentUp.id = item.id

      var createdAt = util.parseDate(item.createdAt)
      shopCommentUp.createdAt = createdAt.valueOf()
      shopCommentUp.createdDate = numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD HH:mm:SS')
      shopCommentUp.shopCommentUpTime = numberUtils.getConversationTime(createdAt.valueOf())
      var updatedAt = util.parseDate(item.updatedAt)
      shopCommentUp.updatedAt = updatedAt.valueOf()

      var attrs = item.attributes
      shopCommentUp.targetShopCommentId = attrs.targetShopComment.id
      shopCommentUp.status = attrs.status

      var user = {}
      var userAttrs = attrs.user && attrs.user.attributes
      if(userAttrs) {
        user.id = attrs.user.id
        user.nickname = userAttrs.nickname
        user.avatar = userAttrs.avatar
      }
      shopCommentUp.user = user

      shopCommentUps.push(shopCommentUp)
    })
  }
  return shopCommentUps
}

function shopCommentsConcatUps(shopComments, ups) {
  if(shopComments && shopComments.length && ups && ups.length) {
    shopComments.forEach(function(shopComment, index) {
      var shopCommentUps = []
      for(var i = 0; i < ups.length; i++) {
        if(shopComment.id == ups[i].targetShopCommentId) {
          shopCommentUps.push(ups[i])
          ups[i] = null
        }
      }
      ups = ups.filter(function(elem) {
        return elem !== null
      })
      shopComment.ups = shopCommentUps
    })
  }
  return shopComments
}

function shopCommentsConcatReplys(shopComments, replys) {
  if(shopComments && shopComments.length && replys && replys.length) {
    shopComments.forEach(function(shopComment, index) {
      var shopCommentReplys = []
      for(var i = 0; i < replys.length; i++) {
        if(shopComment.id == replys[i].replyShopCommentId) {
          shopCommentReplys.push(replys[i])
          replys[i] = null
        }
      }
      replys = replys.filter(function(elem) {
        return elem !== null
      })
      shopComment.replys = shopCommentReplys
    })
  }
  return shopComments
}


function promotionFromLeancloudObject(leanPromotion, showUser) {
  // var constructUserInfo = require('../cloudFuncs/Auth').constructUserInfo
  var prompAttr = leanPromotion.attributes
  var goodAttr = leanPromotion.attributes.targetGood.attributes
  var shopAttr = goodAttr.targetShop.attributes
  var promotion = {}

  promotion.id = leanPromotion.id
  promotion.startDate = leanPromotion.startDate
  promotion.endDate = leanPromotion.endDate
  promotion.coverPhoto = goodAttr.coverPhoto
  promotion.typeId = prompAttr.typeId
  promotion.type = prompAttr.type
  promotion.typeDesc = prompAttr.typeDesc
  promotion.goodName = goodAttr.goodName
  promotion.goodId = prompAttr.targetGood.id
  promotion.abstract = prompAttr.abstract
  promotion.promotionPrice = prompAttr.promotionPrice
  promotion.originalPrice = goodAttr.originalPrice
  promotion.price = goodAttr.price
  promotion.album = goodAttr.album
  promotion.detail = goodAttr.detail
  promotion.goodStatus = goodAttr.status

  promotion.goodUpadatedAt = prompAttr.targetGood.updatedAt

  promotion.status = prompAttr.status
  promotion.geo = shopAttr.geo
  promotion.shopId = goodAttr.targetShop.id
  promotion.shopName = shopAttr.shopName
  promotion.shopDistrict = shopAttr.geoDistrict
  promotion.createdAt = leanPromotion.createdAt
  promotion.updatedAt = leanPromotion.updatedAt
  return promotion
}


var shopUtil = {
  shopFromLeancloudObject: shopFromLeancloudObject,
  shopCommentFromLeancloudObject: shopCommentFromLeancloudObject,
  shopCommentReplyFromLeancloudObject: shopCommentReplyFromLeancloudObject,
  shopCommentsConcatReplys: shopCommentsConcatReplys,
  shopCommentUpFromLeancloudObject: shopCommentUpFromLeancloudObject,
  shopCommentsConcatUps: shopCommentsConcatUps,
  promotionFromLeancloudObject:promotionFromLeancloudObject
}

module.exports = shopUtil