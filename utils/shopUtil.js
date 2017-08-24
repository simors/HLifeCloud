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
  var shopAttr = prompAttr.targetShop.attributes
  var promotion = {}

  promotion.id = leanPromotion.id
  promotion.startDate = prompAttr.startDate
  promotion.endDate = prompAttr.endDate
  promotion.coverPhoto = goodAttr.coverPhoto
  promotion.typeId = prompAttr.typeId
  promotion.type = prompAttr.type
  promotion.typeDesc = prompAttr.typeDesc
  promotion.goodName = goodAttr.goodsName
  promotion.goodId = prompAttr.targetGood.id
  promotion.abstract = prompAttr.abstract
  promotion.promotionPrice = prompAttr.promotionPrice
  promotion.originalPrice = goodAttr.originalPrice
  promotion.price = goodAttr.price
  promotion.album = goodAttr.album
  promotion.detail = goodAttr.detail
  promotion.goodStatus = goodAttr.status

  promotion.goodUpdatedAt = prompAttr.targetGood.updatedAt

  promotion.status = prompAttr.status
  promotion.geo = shopAttr.geo
  promotion.shopId = prompAttr.targetShop.id
  promotion.shopName = shopAttr.shopName
  promotion.shopDistrict = shopAttr.geoDistrict
  promotion.createdAt = leanPromotion.createdAt
  promotion.updatedAt = leanPromotion.updatedAt
  return promotion
}

function shopGoodFromLeancloudObject(goodLean){
  var shop = goodLean.attributes.targetShop
  var shopAttr = shop.attributes
  var promotion = goodLean.attributes.goodsPromotion
  var good = {}
  good.objectId = goodLean.id
  good.targetShop = shop.id
  good.goodsName = goodLean.attributes.goodsName
  good.price = goodLean.attributes.price
  good.originalPrice = goodLean.attributes.originalPrice
  good.coverPhoto = goodLean.attributes.coverPhoto
  good.album = goodLean.attributes.album
  good.status = goodLean.attributes.status
  good.detail = goodLean.attributes.detail
  good.updatedAt = goodLean.updatedAt
  if(promotion&&promotion.attributes&&promotion.attributes.status!=0){
    var promotionAttr = promotion.attributes
    good.promotionId = promotion.id
    good.promotionType = promotionAttr.type
    good.promotionPrice = promotionAttr.promotionPrice
    good.promotionAbstract = promotionAttr.abstract
    good.startDate = promotionAttr.startDate
    good.endDate = promotionAttr.endDate
  }else{
    good.promotionId =undefined
  }
  return good

}

function newShopCommentFromLeanCloudObject(result){

  // var position = result.attributes.position
  var parentComment = result.attributes.parentComment
  var replyComment = result.attributes.replyComment
  var user = result.attributes.user
  var comment = {
    content: result.attributes.content,
    commentId : result.id,
    shopId : result.attributes.targetShop.id,
    blueprints: result.attributes.blueprints,
    parentCommentContent : parentComment?result.attributes.parentComment.attributes.content:undefined,
    parentCommentUserName : parentComment?result.attributes.parentComment.attributes.user.attributes.username:undefined,
    parentCommentNickname : parentComment?result.attributes.parentComment.attributes.user.attributes.nickname:undefined,
    parentCommentId : parentComment?result.attributes.parentComment.id:undefined,
    replyCommentContent : replyComment?result.attributes.replyComment.attributes.content:undefined,
    replyCommentUserName : replyComment?result.attributes.replyComment.attributes.user.attributes.username:undefined,
    replyCommentNickname : replyComment?result.attributes.replyComment.attributes.user.attributes.nickname:undefined,
    replyCommentId : replyComment?result.attributes.replyComment.id:undefined,
    upCount : result.attributes.upCount,
    authorUsername : user?result.attributes.user.attributes.username:undefined,
    authorNickname : user?result.attributes.user.attributes.nickname:undefined,
    commentCount : result.attributes.commentCount,
    authorId : user?result.attributes.user.id:undefined,
    authorAvatar : user?user.attributes.avatar:undefined,
    createdAt : result.createdAt,
    // address : position?position.address:undefined,
    // city : position?position.city:undefined,
    // longitude : position?position.longitude:undefined,
    // latitude : position?position.latitude:undefined,
    // streetNumber : position?position.streetNumber:undefined,
    // street : position?position.street:undefined,
    // province : position?position.province:undefined,
    // country : position?position.country:undefined,
    // district : position?position.district:undefined,
    updatedAt : result.updatedAt,
    updatedDate : numberUtils.formatLeancloudTime(result.updatedAt, 'YYYY-MM-DD'),
    createdDate : numberUtils.formatLeancloudTime(result.createdAt, 'YYYY-MM-DD')
  }
  return comment
}
var shopUtil = {
  shopFromLeancloudObject: shopFromLeancloudObject,
  shopCommentFromLeancloudObject: shopCommentFromLeancloudObject,
  shopCommentReplyFromLeancloudObject: shopCommentReplyFromLeancloudObject,
  shopCommentsConcatReplys: shopCommentsConcatReplys,
  shopCommentUpFromLeancloudObject: shopCommentUpFromLeancloudObject,
  shopCommentsConcatUps: shopCommentsConcatUps,
  promotionFromLeancloudObject:promotionFromLeancloudObject,
  shopGoodFromLeancloudObject: shopGoodFromLeancloudObject,
  newShopCommentFromLeanCloudObject: newShopCommentFromLeanCloudObject
}

module.exports = shopUtil