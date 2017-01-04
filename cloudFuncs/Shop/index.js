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

  if(!isRefresh && lastCreatedAt) { //分页查询
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
    var shopComments = shopUtil.shopCommentFromLeancloudObject(results)
    response.success(shopComments)
  }, function(err) {
    response.error(err)
  })
}

var authFunc = {
  fetchShopCommentList: fetchShopCommentList
}

module.exports = authFunc