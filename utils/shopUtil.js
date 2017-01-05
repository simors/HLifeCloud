/**
 * Created by zachary on 2017/1/4.
 */

var numberUtils = require('./numberUtils');
var util = require('./util');

function shopCommentFromLeancloudObject(results) {
  var shopComments = []
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
    }
    shopComment.user = user
    shopComments.push(shopComment)
  })
  return shopComments
}

function shopCommentReplyFromLeancloudObject(results) {
  var shopCommentReplys = []
  results.forEach(function(item, index) {
    var shopCommentReply = {}
    shopCommentReply.id = item.id
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
    }
    shopCommentReply.user = user

    var parentReply = {}
    var parentReplyAttrs = attrs.parentReply && attrs.parentReply.attributes
    if(parentReplyAttrs) {
      parentReply.id = attrs.parentReply.id

      var _user = {}
      var parentReplyAttrsUserAttrs = parentReplyAttrs.user && parentReplyAttrs.user.attributes
      if(parentReplyAttrsUserAttrs) {
        _user.id = attrs.user.id
        _user.nickname = userAttrs.nickname
        _user.avatar = userAttrs.avatar
      }
      parentReply.user = _user
      shopCommentReply.parentReply = parentReply
    }
    shopCommentReplys.push(shopCommentReply)
  })

  return shopCommentReplys
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

var shopUtil = {
  shopCommentFromLeancloudObject: shopCommentFromLeancloudObject,
  shopCommentReplyFromLeancloudObject: shopCommentReplyFromLeancloudObject,
  shopCommentsConcatReplys: shopCommentsConcatReplys
}

module.exports = shopUtil