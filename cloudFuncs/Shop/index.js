/**
 * Created by zachary on 2017/01/04.
 */

var AV = require('leanengine');
var shopUtil = require('../../utils/shopUtil');

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
  return query.find().then(function(results) {
    try{
      var shopComments = shopUtil.shopCommentFromLeancloudObject(results)

      if(shopComments && shopComments.length) {
        var queryArr = []
        shopComments.forEach(function(item, index){
          var replyQuery = new AV.Query('ShopCommentReply')
          var shopComment = AV.Object.createWithoutData('ShopComment', item.id)
          replyQuery.equalTo('replyShopComment', shopComment)
          queryArr.push(replyQuery)
        })

        var orQuery = AV.Query.or.apply(null, queryArr)
        orQuery.include(['user', 'parentReply', 'parentReply.user'])
        orQuery.addDescending('createdAt')

        return orQuery.find().then(function(orResults){
          var replys = shopUtil.shopCommentReplyFromLeancloudObject(orResults)
          shopUtil.shopCommentsConcatReplys(shopComments, replys)
          response.success(shopComments)
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
  query.addDescending('createdAt')

  return query.find().then(function(results){
    var replys = shopUtil.shopCommentReplyFromLeancloudObject(results)
    response.success(replys)
  }, function(err) {
    response.error(err)
  })
}

var authFunc = {
  fetchShopCommentList: fetchShopCommentList,
  fetchShopCommentReplyList: fetchShopCommentReplyList
}

module.exports = authFunc