/**
 * Created by wuxingyu on 2017/2/18.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
//去掉空格
function Trim(str) {
  return str.replace(/(^\s*)|(\s*$)/g, "");
}

//获取人员名单
function getTopicList(request, response) {
  var topicList = []
  var orderMode = request.params.orderMode
  var topicQuery = new AV.Query('Topics')
  if (orderMode == 'createTimeDescend') {
    topicQuery.descending('createdAt');
  }
  else if (orderMode == 'createTimeAscend') {
    topicQuery.ascending('createdAt');
  }
  else if (orderMode == 'likeCountDescend') {
    topicQuery.descending('likeCount');
  }
  else if (orderMode == 'commentNumDescend') {
    topicQuery.descending('commentNum');
  }
  else{
    topicQuery.descending('createdAt');
  }

  topicQuery.include(['user'])
  topicQuery.include(['category'])

  topicQuery.find().then((results)=> {

    results.forEach((result)=> {
      topicList.push({
        id:        result.id,
        title:     result.attributes.title,
        content:   result.attributes.content,
        commentNum:result.attributes.commentNum,
        likeCount: result.attributes.likeCount,
        username:  result.attributes.user.attributes.nickname,
        category:  result.attributes.category.attributes.title,
        createdAt: result.createdAt
      })
    })
    response.success(topicList)
  }), (err)=> {
      response.error(err)
    }
}

var TopicManagerFunc = {
  getTopicList: getTopicList,
}
module.exports = TopicManagerFunc
