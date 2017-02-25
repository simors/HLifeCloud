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
  var type = request.params.type
  var topicQuery = new AV.Query('Topics')
  if (type == 'createTimeDescend') {
    topicQuery.descending('createdAt');
  }
  else if (type == 'createTimeAscend') {
    topicQuery.ascending('createdAt');
  }
  else if (type == 'likeCountDescend') {
    topicQuery.descending('likeCount');
  }
  else if (type == 'likeCountAscend') {
    topicQuery.ascending('likeCount');
  }
  else if (type == 'commentNumAscend') {
    topicQuery.ascending('commentNum');
  }
  else if (type == 'commentNumDescend') {
    topicQuery.descending('commentNum');
  }
  topicQuery.include(['user'])
  topicQuery.include(['topicCategory'])
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
