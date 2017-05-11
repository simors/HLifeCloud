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
    let userQuery = new AV.SearchQuery('_User')
  let shopQuery = new AV.SearchQuery('Shop')
  let topicsQuery = new AV.SearchQuery('Topics')

  userQuery.queryString(key)
  shopQuery.queryString(key)
  topicsQuery.queryString(key)

  return userQuery.find().then((userResults) => {
    searchResult.user = []

    if(userResults.length > 0) {
      userResults.forEach((value) => {
        console.log("user value:", value)
        userInfo = value.attributes
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
        console.log("shop value:", value)
        shopInfo = value.attributes
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
        console.log("topic value:", value)
        topicInfo = value.attributes
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
  var userResult = []

  let userQuery = new AV.SearchQuery('_User')
  console.log("userQuery", userQuery)
  userQuery.queryString(key)
  userQuery.limit(10)
  if(sid)
    userQuery.sid(sid)
  else
    userQuery.reset()

  return userQuery.find().then((results) => {
    if(results.length > 0) {
      results.forEach((value) => {
        userInfo = value.attributes
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
      result: userResult
    })

  }).catch((error) => {
    console.log("error", error)
    response.error(error)
  })
}

function fetchShopResult(request, response) {
  var key = request.params.key
  var sid = request.params.sid

  var shopResult = []

  let shopQuery = new AV.SearchQuery('Shop')
  shopQuery.queryString(key)
  shopQuery.limit(10)
  if(sid)
    shopQuery.sid(sid)
  else
    shopQuery.reset()

  return shopQuery.find().then((results) => {
    if(results.length > 0) {
      results.forEach((value) => {
        console.log("shop value:", value)
        shopInfo = value.attributes
        shopResult.push({
          id: value.id,
          shopName: shopInfo.shopName,
          album: shopInfo.album || '',
          shopAddress: shopInfo.shopAddress || '地址不详'
        })
      })
    }
    response.success({
      hits: shopQuery.hits(),
      sid: shopQuery._sid,
      result: shopResult,

    })
  }).catch((error) => {
    console.log("error", error)
    response.error(error)
  })
}

function fetchTopicResult(request, response) {
  var key = request.params.key
  var sid = request.params.sid

  var topicResult = []

  let topicQuery = new AV.SearchQuery('Topics')
  topicQuery.queryString(key)
  topicQuery.limit(10)
  if(sid)
    topicQuery.sid(sid)
  else
    topicQuery.reset()

  return topicQuery.find().then((results) => {
    console.log("results.length:", results.length)

    if(results.length > 0) {
      results.forEach((value) => {
        topicInfo = value.attributes
        topicResult.push({
          id: value.id,
          title: topicInfo.title,
          imgGroup: topicInfo.imgGroup,
          abstract: topicInfo.abstract
        })
      })
    }
    response.success({
      hits: topicQuery.hits(),
      sid: topicQuery.sid,
      result: topicResult
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

