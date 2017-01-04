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
      targetShop.shopName = targetShopAttrs.shopName
    }
    shopComment.targetShop = targetShop

    var user = {}
    var userAttrs = attrs.user.attributes
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

var shopUtil = {
  shopCommentFromLeancloudObject: shopCommentFromLeancloudObject
}

module.exports = shopUtil