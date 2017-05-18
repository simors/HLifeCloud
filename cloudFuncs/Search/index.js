/**
 * Created by wanpeng on 2017/5/10.
 */
var AV = require('leanengine');


/**
 * 根据关键词搜索用户、话题和店铺信息
 * @param key
 * @returns {*}
 */
function fetchSearchResult(request, response) {
    var searchResult = {}

    var key = request.params.key
    var userQuery = new AV.SearchQuery('_User')
  var shopQuery = new AV.SearchQuery('Shop')
  var topicsQuery = new AV.SearchQuery('Topics')

  userQuery.queryString(key)
  shopQuery.queryString(key)
  topicsQuery.queryString(key)

  return userQuery.find().then((userResults) => {
    searchResult.user = []

    if(userResults.length > 0) {
      userResults.forEach((value) => {
        var userInfo = value.attributes
        searchResult.user.push({
          id: value.id,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
        })
      })
    }
    return shopQuery.find()
  }).then((shopResults) => {
    searchResult.shop = []
    if(shopResults.length > 0) {
      shopResults.forEach((value) => {
        var shopInfo = value.attributes
        searchResult.shop.push({
          id: value.id,
          shopName: shopInfo.shopName,
          album: shopInfo.album || '',
          shopAddress: shopInfo.shopAddress || '地址不详'
        })
      })
    }
    return topicsQuery.find()
  }).then((topicResults) => {
    searchResult.topic = []

    if(topicResults.length > 0) {
      topicResults.forEach((value) => {
        var topicInfo = value.attributes
        searchResult.topic.push({
          id: value.id,
          title: topicInfo.title,
          imgGroup: topicInfo.imgGroup,
          abstract: topicInfo.abstract
        })

      })
    }
    response.success(searchResult)
  }).catch((error) => {
    console.log("error", error)
    response.error(error)
  })

}

function fetchUserResult(request, response) {
  var key = request.params.key
  var sid = request.params.sid
  var limit = request.params.limit

  var userResult = []

  var userQuery = new AV.SearchQuery('_User')
  userQuery.queryString(key)
  if(limit)
    userQuery.limit(limit)
  else
    userQuery.limit(10)

  if(sid)
    userQuery.sid(sid)
  else
    userQuery.reset()

  return userQuery.find().then((results) => {
    if(results.length > 0) {
      results.forEach((value) => {
        var userInfo = value.attributes
        userResult.push({
          id: value.id,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
        })
      })
    }
    response.success({
      hits: userQuery.hits(),
      sid: userQuery._sid,
      users: userResult
    })

  }).catch((error) => {
    console.log("error", error)
    response.error(error)
  })
}

function fetchShopResult(request, response) {
  var key = request.params.key
  var sid = request.params.sid
  var limit = request.params.limit
  var shopResult = []

  var shopQuery = new AV.SearchQuery('Shop')
  shopQuery.queryString(key)
  if(limit)
    shopQuery.limit(limit)
  else
    shopQuery.limit(10)

  if(sid)
    shopQuery.sid(sid)
  else
    shopQuery.reset()

  return shopQuery.find().then((results) => {
    if(results.length > 0) {
      results.forEach((value) => {
        var shopInfo = value.attributes
        shopResult.push({
          id: value.id,
          shopName: shopInfo.shopName,
          coverUrl: shopInfo.coverUrl || '',
          shopAddress: shopInfo.shopAddress || '地址不详',
          score: shopInfo.score || 2
        })
      })
    }
    response.success({
      hits: shopQuery.hits(),
      sid: shopQuery._sid,
      shops: shopResult,

    })
  }).catch((error) => {
    console.log("error", error)
    response.error(error)
  })
}

function fetchTopicResult(request, response) {
  var key = request.params.key
  var sid = request.params.sid
  var limit = request.params.limit

  var topicResult = []

  var topicQuery = new AV.SearchQuery('Topics')
  topicQuery.queryString(key)
  topicQuery.include('user')
  topicQuery.include('category')
  if(limit)
    topicQuery.limit(limit)
  else
    topicQuery.limit(10)

  if(sid)
    topicQuery.sid(sid)
  else
    topicQuery.reset()

  return topicQuery.find().then((results) => {

    if(results.length > 0) {
      results.forEach((value) => {
        var topicInfo = value.attributes
        var userInfo = topicInfo.user.attributes
        topicResult.push({
          title: topicInfo.title,
          imgGroup: topicInfo.imgGroup,
          abstract: topicInfo.abstract,
          content: topicInfo.content, //话题内容
          objectId: value.id,  //话题id
          categoryId: topicInfo.category.id,  //属于的分类
          categoryName: topicInfo.category.attributes.title, // 话题分类名
          nickname: userInfo.nickname,
          userId: topicInfo.user.id,
          createdAt: value.createdAt,  //创建时间
          avatar: userInfo.avatar,
          commentNum: topicInfo.commentNum, //评论数
          likeCount: topicInfo.likeCount, //点赞数
          geoPoint: topicInfo.geoPoint,
          position: topicInfo.position,
        })
      })
    }
    response.success({
      hits: topicQuery.hits(),
      sid: topicQuery._sid,
      topics: topicResult
    })
  }).catch((error) => {
    console.log("error", error)
    response.error(error)
  })
}

var searchFunc = {
  fetchSearchResult: fetchSearchResult,
  fetchUserResult: fetchUserResult,
  fetchShopResult: fetchShopResult,
  fetchTopicResult: fetchTopicResult,
}

module.exports = searchFunc

