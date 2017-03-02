/**
 * Created by wuxingyu on 2017/2/18.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
//去掉空格
function Trim(str) {
  return str.replace(/(^\s*)|(\s*$)/g, "");
}

//获取话题名单
function getTopicList(request, response) {
  var topicList = []
  var orderMode = request.params.orderMode
  var categoryName = request.params.categoryName
  var filterValue = request.params.filterValue
  var topicQuery = new AV.Query('Topics')
  var innerQuery = new AV.Query('TopicCategory');

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
  else {
    topicQuery.descending('createdAt');
  }
  if (!request.params.startTime) {
    topicQuery.greaterThanOrEqualTo('createdAt', new Date('2017-01-28 00:00:00'));
    topicQuery.lessThan('createdAt', new Date());
  }
  else {
    topicQuery.greaterThanOrEqualTo('createdAt', request.params.startTime);
    topicQuery.lessThan('createdAt', request.params.endTime);
  }

  if (request.params.picked) {
    topicQuery.equalTo('picked', true);
  }
  topicQuery.contains('title', filterValue);
  innerQuery.contains('title', categoryName);

  topicQuery.include(['user'])
  topicQuery.include(['category'])
  topicQuery.matchesQuery('category', innerQuery);

  topicQuery.find().then((results)=> {

    results.forEach((result)=> {
      topicList.push({
        id: result.id,
        title: result.attributes.title,
        content: result.attributes.content,
        commentNum: result.attributes.commentNum,
        likeCount: result.attributes.likeCount,
        picked: result.attributes.picked,
        username: result.attributes.user.attributes.nickname,
        category: result.attributes.category.attributes.title,
        createdAt: result.createdAt
      })
    })
    response.success(topicList)
  }), (err)=> {
    response.error(err)
  }
}

function updateTopicPicked(request, response) {
  var topic = AV.Object.createWithoutData('Topics', request.params.id);
  // 修改属性
  topic.set('picked', request.params.picked);
  // 保存到云端
  topic.save().then((topic)=> {
    response.success({
      topic: topic,
    })
  }, (err)=> {
    response.error(err)
  })
}

function updateTopicCategoryPicked(request, response) {
  var topicCategory = AV.Object.createWithoutData('TopicCategory', request.params.id);
  // 修改属性
  if(request.params.picked != undefined) {
    topicCategory.set('isPicked', request.params.picked);
  }

  if(request.params.introduction){
    topicCategory.set('introduction', request.params.introduction);
  }
  // 保存到云端
  topicCategory.save().then((topic)=> {
    response.success({
      topicCategory: topicCategory,
    })
  }, (err)=> {
    response.error(err)
  })
}

function getTopicCategoryList(request, response) {
  var topicCategoryList = []
  var filterValue = ''
  if(request.params.filterValue){
    filterValue = request.params.filterValue
  }

  var query = new AV.Query('TopicCategory');
  if (request.params.picked) {
    query.equalTo('isPicked', true);
  }
  if (!request.params.startTime) {
    query.greaterThanOrEqualTo('createdAt', new Date('2016-01-28 00:00:00'));
    query.lessThan('createdAt', new Date());
  }
  else {
    query.greaterThanOrEqualTo('createdAt', request.params.startTime);
    query.lessThan('createdAt', request.params.endTime);
  }

  query.contains('title', filterValue);
  query.find().then((results)=> {

    results.forEach((result)=> {
      topicCategoryList.push({
        id: result.id,
        title: result.attributes.title,
        createdAt: result.createdAt,
        isPicked: result.attributes.isPicked,
        introduction: result.attributes.introduction,
      })
    })
    response.success(topicCategoryList)
  }), (err)=> {
    response.error(err)
  }
}

function createNewTopicCategory(request, response) {
  var name = request.params.name
  var introduction = request.params.introduction

  var TopicCategory = AV.Object.extend('TopicCategory')
  var topicCategory = new TopicCategory()
  topicCategory.set('title', name)
  topicCategory.set('introduction', introduction)
  topicCategory.save().then((result)=> {
    response.success(result)
  }, (err)=> {
    response.error(err)
  })
}

var TopicManagerFunc = {
  updateTopicPicked: updateTopicPicked,
  getTopicList: getTopicList,
  getTopicCategoryList: getTopicCategoryList,
  updateTopicCategoryPicked:updateTopicCategoryPicked,
  createNewTopicCategory:createNewTopicCategory
}

module.exports = TopicManagerFunc
