/**
 * Created by wuxingyu on 2017/2/18.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var ejs = require('ejs')
var fs  = require('fs')
//去掉空格
function Trim(str) {
  return str.replace(/(^\s*)|(\s*$)/g, "");
}

//更新话题状态
function updateTopicStatus(request,response){
  var id = request.params.id
  var status = request.params.status
  var topic = AV.Object.createWithoutData('Topics',id)
  topic.set('status',status)
  topic.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}
//获取话题名单
function getTopicList(request, response) {
  var topicList = []
  var status = request.params.status
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
  if(status){
    topicQuery.equalTo('status',status)
  }
  if (request.params.picked) {
    topicQuery.equalTo('picked', true);
  }
  if(filterValue){
    topicQuery.contains('title', filterValue);

  }

  if(categoryName){
    innerQuery.contains('title', categoryName);
  }

  topicQuery.include(['user'])
  topicQuery.include(['category'])

  topicQuery.matchesQuery('category', innerQuery);

  topicQuery.find().then((results)=> {

    results.forEach((result)=> {
      // console.log('here is code ===============>',result.attributes)

      topicList.push({
        id: result.id,
        title: result.attributes.title,
        content: result.attributes.content,
        commentNum: result.attributes.commentNum,
        likeCount: result.attributes.likeCount,
        status:result.attributes.status,
        picked: result.attributes.picked,
        username: result.attributes.user.attributes.nickname,
        category: result.attributes.category.attributes.title,
        createdAt: result.createdAt
      })
      // console.log('here is code ===============>',result.attributes)

    })
    response.success(topicList)
  }), (err)=> {
    response.error(err)
  }
}
//测试增加所有话题的status
function fetchAllTopicStatus(request,response) {
  var query = new AV.Query('Topics')
  query.find().then((results)=>{
    results.forEach((result)=>{
      result.set('status',1)
    })
    return AV.Object.saveAll(results).then((todos)=>{
      response.success({success:true})
    },(err)=>{
      response.error(err)
    })
  })
}
//获取精选话题名单
function getPickedTopicList(request, response) {
  var topicList = []
  var topicQuery = new AV.Query('Topics')

  topicQuery.descending('createdAt')
  topicQuery.equalTo('picked', true);

  topicQuery.include(['user'])
  topicQuery.include(['category'])

  if (request.params.limit) {
    topicQuery.limit(request.params.limit)
  }
  var limit = request.params.limit ? request.params.limit : 100    // 默认只返回10条数据
  topicQuery.limit(limit)
  topicQuery.find().then((results)=> {

    results.forEach((result)=> {
      topicList.push({
        content: result.attributes.content, //话题内容
        title: result.attributes.title,
        abstract:result.attributes.abstract,
        imgGroup: result.attributes.imgGroup, //图片
        objectId: result.id,  //话题id
        categoryId: result.attributes.category.id,  //属于的分类
        categoryName: result.attributes.category.attributes.title, // 话题分类名
        nickname: result.attributes.user.attributes.nickname, //所属用户昵称
        userId:result.attributes.user.id,     // 所属用户的id
        createdAt: result.createdAt,  //创建时间
        avatar: result.attributes.user.attributes.avatar,  //所属用户头像
        commentNum: result.attributes.commentNum, //评论数
        likeCount: result.attributes.likeCount, //点赞数
        geoPoint: result.attributes.geoPoint,
        position: result.attributes.position,
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

  if(request.params.enabled != undefined){
    topicCategory.set('enabled', request.params.enabled);
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
  var filterValue = request.params.filterValue


  var query = new AV.Query('TopicCategory');
  if (request.params.picked!=undefined) {
    if (request.params.picked == true) {
      query.equalTo('isPicked', true);
    }
  }
  if (!request.params.startTime) {
    query.greaterThanOrEqualTo('createdAt', new Date('2016-01-28 00:00:00'));
    query.lessThan('createdAt', new Date());
  }
  else {
    query.greaterThanOrEqualTo('createdAt', request.params.startTime);
    query.lessThan('createdAt', request.params.endTime);
  }
  if (request.params.enabled!=undefined) {
    if (request.params.enabled == true){
      query.equalTo('enabled', true);
    }
  }
  if(filterValue){
    query.contains('title', filterValue);
  }
  var limit = request.params.limit ? request.params.limit : 100    // 默认只返回10条数据
  query.limit(limit)
  query.find().then((results)=> {

    results.forEach((result)=> {
      topicCategoryList.push({
        id: result.id,
        title: result.attributes.title,
        createdAt: result.createdAt,
        isPicked: result.attributes.isPicked,
        introduction: result.attributes.introduction,
        image: result.attributes.image,
        enabled: result.attributes.enabled,
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
  var id = request.params.id
  if(id&&id!=''){
    var topicCategory = AV.Object.createWithoutData('TopicCategory',id)
    if(name){
      topicCategory.set('title',name)
    }
    if(introduction){
      topicCategory.set('introduction',introduction)
    }
    topicCategory.save().then(()=>{
      response.success()
    },(err)=>{
      response.error(err)
    })
  }else{
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
}

function getTopicById(topicId) {
  var query = new AV.Query('Topics')

  return query.get(topicId).then((result) => {
    var topic = result.attributes
    return {
      title: topic.title,
      content: JSON.parse(topic.content),
      abstract: topic.abstract
    }
  }).catch((error) => {
    console.log(error)
    return undefined
  })
}

function shareTopicById(request, response) {
  var id = request.params.topicId

  getTopicById(id).then((topic) => {

    var str = fs.readFileSync(__dirname + '/topicShare.ejs', 'utf8')
    var template = ejs.compile(str)
    var shareHtml = template(topic)
    var buffer = new Buffer(shareHtml).toString('base64')
    var data = { base64: buffer }

    var file = new AV.File("topic_topicId" + id, data, 'text/html')
    return file.save()

  }).then((savedFile) => {
    if(savedFile.attributes.url) {
      response.success({
        url: savedFile.attributes.url
      })
      return
    }
    response.error({
      errorCode: 1,
      message: "share html file save failed!"
    })
  }).catch((error) => {
    console.log(error)
    response.error(error)
  })
}

var TopicManagerFunc = {
  updateTopicPicked: updateTopicPicked,
  getTopicList: getTopicList,
  getTopicCategoryList: getTopicCategoryList,
  updateTopicCategoryPicked:updateTopicCategoryPicked,
  createNewTopicCategory:createNewTopicCategory,
  getPickedTopicList:getPickedTopicList,
  fetchAllTopicStatus:fetchAllTopicStatus,
  updateTopicStatus:updateTopicStatus,
}

module.exports = TopicManagerFunc
