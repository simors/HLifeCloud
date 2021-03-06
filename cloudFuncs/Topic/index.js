/**
 * Created by lilu on 2017/4/17.
 */
var AV = require('leanengine');
var Promise = require('bluebird')
var topicUtil = require('../../utils/topicUtil');
var util = require('../../utils/util');
var numberUtils = require('../../utils/numberUtils')
function disableTopicByUser(request,response){
  var id = request.params.id
  var topic = AV.Object.createWithoutData('Topics',id)
  topic.set('status',0)
  topic.save().then(()=>{
    response.success({errcode: 0})
  },(err)=>{response.error({errcode:1,message:err})})
}

function fetchTopicComments(request, response) {
	try{
		var topicId = request.params.topicId;
		var isRefresh = request.params.isRefresh;
		var lastCreatedAt = request.params.lastCreatedAt;

		var currentUser = request.currentUser

		var query = new AV.Query('TopicComments')

	  var topic = AV.Object.createWithoutData('Topics', topicId)
	  query.equalTo('topic', topic)

	  // console.log('isRefresh====', isRefresh)
	  // console.log('lastCreatedAt====', lastCreatedAt)
	  if(!isRefresh && lastCreatedAt) { //分页查询
	    query.lessThan('createdAt', new Date(lastCreatedAt))
	  }

	  query.limit(5)
	  
	  query.include(['user']);
	  query.include(['parentComment']);
	  query.include(['parentComment.user']);
	  query.descending('createdAt')
	  // console.log('fetchTopicComments.query====', query)
	  return query.find().then(function (results) {
	    // console.log('fetchTopicComments.results====', results)
	    var topicComments = []
	    var topicCommentLikesCountPromosies = []
	    var userLikeTopicInfoQueryArr = []
	    if (results) {
	      results.forEach((result) => {
	        topicComments.push(topicUtil.topicCommentFromLeancloudObject(result))

	        var topicCommentLikesCountQuery = new AV.Query('Up');
	        topicCommentLikesCountQuery.equalTo('targetId', result.id)
	        topicCommentLikesCountQuery.equalTo('upType', 'topicComment')
	        topicCommentLikesCountQuery.equalTo('status', true)

	        topicCommentLikesCountPromosies.push(topicCommentLikesCountQuery.count())

	        if(currentUser) {
	        	var userLikeTopicInfoQuery = new AV.Query('Up')
		        userLikeTopicInfoQuery.equalTo('targetId', result.id)
					  userLikeTopicInfoQuery.equalTo('upType', 'topicComment')
					  userLikeTopicInfoQuery.equalTo('user', currentUser)
					  userLikeTopicInfoQueryArr.push(userLikeTopicInfoQuery)
	        }

	      })

	      // console.log('topicCommentLikesCountOrQuery----->>>', topicCommentLikesCountOrQuery)
	      return Promise.all(topicCommentLikesCountPromosies).then(function(results){
	      	topicComments.forEach((item, index) => {
	      		item.likeCount = results[index]
	      	})

	      	if(userLikeTopicInfoQueryArr.length) {
	      		var userLikeTopicInfoOrQuery = AV.Query.or.apply(null, userLikeTopicInfoQueryArr)
	      		userLikeTopicInfoOrQuery.include(['user'])
	      		return userLikeTopicInfoOrQuery.find().then((orResults) => {
	      			try{
	      				if(orResults && orResults.length) {
		      				orResults.forEach((item, index) => {
		      					var userUpInfo = topicUtil.upFromLeancloudObject(item)
		      					for(var i = 0; i < topicComments.length; i++) {
		      						if(topicComments[i].objectId == userUpInfo.targetId) {
		      							topicComments[i].userUpInfo = userUpInfo
		      						}
		      					}
		      				})
		      			}
	      			}catch(err) {
	      				console.log('kfjdk.err-----', err)
	      			}


	      			response.success(topicComments)
	      		}, (error) => {
	      			response.success(topicComments)
	      			console.log('userLikeTopicInfoOrQuery.error======', error)
	      		})
	      	}else {
	      		response.success(topicComments)
	      	}
	      }, function(error){
	      	response.success(topicComments)
	      	console.log('topicCommentLikesCountPromosies.error----------', error)
	      })
	    }
	  } , function (err) {
	    response.error(err)
	  })
	}catch(error) {
		response.error(error)
		console.log('fetchTopicComments.error---->>>', error)
	}
}

function getTopicComments(topicId) {

	var query = new AV.Query('TopicComments')
	var topic = AV.Object.createWithoutData('Topics', topicId)
	query.equalTo('topic', topic)

	query.limit(5)
	query.include(['user']);
	query.include(['parentComment']);
	query.include(['parentComment.user']);
	query.descending('createdAt')

	return query.find().then((results) => {
		var topicComments = []
		if(results && results.length > 0) {
			results.forEach((result) => {
				topicComments.push(topicUtil.topicCommentFromLeancloudObject(result))
			})
		}
		return topicComments
	})
}

function fetchTopicList(request,response){
	var payload = request.params.payload
	var categoryId = payload.categoryId
	var province = payload.province
	var city = payload.city
	var query = new AV.Query('Topics')
	if(payload.type == 'localTopics'){
		if(city && city != '全国') {
			query.equalTo('city', city)
			query.equalTo('province', province)
		}
	}
	if (payload.type == "topics" && categoryId) {
		var category = AV.Object.createWithoutData('TopicCategory', categoryId);
		query.equalTo('category', category)
	}
	if (payload.userId && (payload.type == 'userTopics'||payload.type == "myTopics")) {
		var user = AV.Object.createWithoutData('_User', payload.userId)
		query.equalTo('user', user)
	}
	query.equalTo('status',1)
	if (payload.type == "pickedTopics"||payload.type == "mainPageTopics") {
		query.equalTo('picked', true)
	}
	var isRefresh = payload.isRefresh
	var lastCreatedAt = payload.lastCreatedAt
	var lastUpdatedAt = payload.lastUpdatedAt
	if (!isRefresh) { //分页查询
		if(lastCreatedAt) {
			query.lessThan('createdAt', new Date(lastCreatedAt))
		}
	}
	query.limit(10) // 最多返回 10 条结果
	query.include('user')
	query.include('category')
	query.descending('createdAt')
	return query.find().then(function (results) {
		var topicList = []
		var topics = []
		results.forEach((result)=>{
			var position = result.attributes.position
			var user = result.attributes.user
			var topic = topicUtil.newTopicFromLeanCloudObject(result)
			topics.push(topic)
			topicList.push(topic.objectId)
		})
		response.success({topics:topics,topicList:topicList})
	},  (err)=> {
		response.error(err)
	})
}

function fetchOtherUserFollowersTotalCount(payload) {
	var userId = payload.userId
	var user = AV.Object.createWithoutData('_User', userId)
	var query = new AV.Query('_Follower')
	query.equalTo('user', user)
	return query.count().then((totalCount)=>{
		// console.log('fetchOtherUserFollowersTotalCount==totalCount=', totalCount)
		return {
			userId: userId,
			followersTotalCount: totalCount
		}
	}, (err) =>{
		err.message = '获取粉丝数量失败'
		return err
	})
}

function fetchTopicLikesCount(payload) {
	var topicId = payload.topicId
	var upType = payload.upType
	var query = new AV.Query('Up')
	query.equalTo('targetId', topicId)
	query.equalTo('upType', upType)
	// query.equalTo('upType', "topic")
	query.equalTo('status', true)
	return query.count().then((results)=> {
		return results
	}, function (err) {
		return err
	})
}

function fetchTopicLikeUsers(payload) {
	var topicId = payload.topicId
	var isRefresh = payload.isRefresh
	var lastCreatedAt = payload.lastCreatedAt

	var query = new AV.Query('Up')

	if(!isRefresh && lastCreatedAt) {
		query.lessThan('createdAt', new Date(lastCreatedAt))
	}

	query.include(['user']);
	query.equalTo('targetId', topicId)
	query.equalTo('upType', "topic")
	query.equalTo('status', true)
	query.limit(10)
	query.addDescending('createdAt')

	// console.log('fetchTopicLikeUsers.query===', query)
	return query.find().then((results)=> {
		var upList = []
		if (results) {
			results.forEach((result) => {


          var up = topicUtil.upFromLeancloudObject(result)
          upList.push(up)

			})
		}
		return upList
	}, function (err) {
		return err
	})
}

function fetchUserLikeTopicInfo(payload){
	var topicId = payload.topicId
	var upType = payload.upType
	var currentUser = AV.Object.createWithoutData('_User',payload.userId)

	var query = new AV.Query('Up')
	query.equalTo('targetId', topicId)
	query.equalTo('upType', upType)
	query.equalTo('user', currentUser)
	query.include('user')
	return query.first().then((result) => {
		var userUpShopInfo = undefined
		if (result && result.attributes.user) {
			var userInfo= result.attributes.user
			userUpShopInfo = {
				id:result.id,
				userId:userInfo.id,
				nickname:userInfo.nickname,
				upType:result.attributes.upType,
				targetId:result.attributes.targetId,
				status:result.attributes.status,
				createdAt:result.createdAt,
				updatedAt:result.updatedAt,
			}
		}
		return userUpShopInfo
	}, function (err) {
		return err
	})
}

function fetchTopicDetailInfo(request,response){
	var topicId = request.params.topicId
	// var authorId = request.params.authorId
	var userId = request.params.userId
	var upType = 'topic'
	fetchOtherUserFollowersTotalCount({userId:userId}).then((followersCount)=>{
			fetchTopicLikeUsers({topicId:topicId,upType:upType,isRefresh:true}).then((likeUsers)=>{
					response.success({
						followerCount:followersCount,
						likeUsers:likeUsers,
					})
			},(err)=>{
				response.error(err)
			})
	},(err)=>{
		response.error(err)
	})
}

function fetchUpsByTopicId(request,response){
  var topicId = request.params.topicId
  // var authorId = request.params.authorId
  var isRefresh = request.params.isRefresh
  var lastCreatedAt = request.params.lastCreatedAt

  var upType = 'topic'
  var payload = {
    topicId: topicId,
    isRefresh: isRefresh,
    lastCreatedAt: lastCreatedAt,
    upType: upType,
  }
    fetchTopicLikeUsers(payload).then((ups)=>{
      response.success({
        ups:ups,
      })
    },(err)=>{
      response.error(err)
    })
}

function fetchTopicCommentsV2(request,response){
	var topicId = request.params.topicId
	var commentId = request.params.commentId
	var isRefresh = request.params.isRefresh;
	var lastCreatedAt = request.params.lastCreatedAt;
	var query = new AV.Query('TopicComments')

	if(topicId&&topicId!=''){
		var topic = AV.Object.createWithoutData('Topics', topicId)
		query.equalTo('topic', topic)
	}

	if(commentId&&commentId!=''){
		var comment = AV.Object.createWithoutData('TopicComments', commentId)
		query.equalTo('parentComment', comment)
	}else{
		query.doesNotExist('parentComment')
	}

	// console.log('isRefresh====', isRefresh)
	// console.log('lastCreatedAt====', lastCreatedAt)
	if(!isRefresh && lastCreatedAt) { //分页查询
		query.lessThan('createdAt', new Date(lastCreatedAt))
	}

	query.limit(10)

	query.include(['user']);
	query.include(['parentComment']);
	query.include(['parentComment.user']);
	query.include(['replyComment'])
	query.include(['replyComment.user'])

	query.descending('createdAt')
	query.find().then((results)=>{
		var topicCommentList = []
		var allComments = []
		var commentList = []
		results.forEach((result)=>{
			var position = result.attributes.position
			var parentComment = result.attributes.parentComment
			var replyComment = result.attributes.replyComment
      var user = result.attributes.user
			var topicComment = topicUtil.newTopicCommentFromLeanCloudObject(result)
			// console.log('result===<',result.id)
			allComments.push(topicComment)
			commentList.push(topicComment.commentId)
		})
		response.success({allComments:allComments,commentList:commentList})
	},(err)=>{
		response.error(err)
	})
}

function fetchUserUps(request,response){
	var userId = request.params.userId
	var user = AV.Object.createWithoutData('_User',userId)
	var query = new AV.Query('Up')
	query.equalTo('user',user)
	// query.equalTo('upType','topicComment')
	query.equalTo('status',true)
	query.limit(1000)
	query.descending('createdAt')
	query.find().then((results)=>{
		var commentList = []
		var topicList = []
		results.forEach((result)=>{
			// console.log('resultslength',result.attributes.upType)
			if(result.attributes.upType == 'topicComment'&&result.attributes.targetId&&result.attributes.targetId!=''){
				commentList.push(result.attributes.targetId)

			}else if(result.attributes.upType == 'topic'&&result.attributes.targetId&&result.attributes.targetId!=''){
				topicList.push(result.attributes.targetId)
			}
		})
		response.success({commentList:commentList,topicList:topicList})
	},(err)=>{
		response.error(err)
	})
}

function upByUser(request,response){
	var userId = request.params.userId
	var user = AV.Object.createWithoutData('_User',userId)
	var upType = request.params.upType
	var targetId = request.params.targetId
	var upItem = undefined
	var query = new AV.Query('Up')

	if(upType=='topic'){
		upItem = AV.Object.createWithoutData('Topics',targetId)
	} else if(upType=='topicComment'){
		upItem = AV.Object.createWithoutData('TopicComments',targetId)
	}

	query.equalTo('targetId', targetId)

	query.equalTo('user',user)
	query.equalTo('upType',upType)
	query.equalTo('status',true)

	query.find().then((result)=>{
		// console.log('result',result)
		if(result&&result.length){
			response.error({message:'您已经点赞过！'})
		}else{
			var Up = AV.Object.extend('Up')
			var up = new Up()
			up.set('user',user)
			up.set('targetId',targetId)
			up.set('status',true)
			up.set('upType',upType)
			up.save().then((item)=>{
				upItem.increment("likeCount", 1)
				upItem.save().then(()=>{
          var upQuery = new AV.Query('Up')
          upQuery.include('user')
          upQuery.get(item.id).then((up)=>{
            var upDetail = topicUtil.upFromLeancloudObject(up)
            response.success(upDetail)
          },(err)=>{
            response.error(err)
          })
				},(err)=>{
					response.error(err)
				})
			},(err)=>{
				response.error(err)
			})
		}
	},(err)=>{
		response.error(err)
	})
}

function pubulishTopicComment(request,response){
	var payload = request.params.payload
	var TopicComment = AV.Object.extend('TopicComments')
	var topicComment = new TopicComment()
	var topic = AV.Object.createWithoutData('Topics', payload.topicId)
	var user = AV.Object.createWithoutData('_User', payload.userId)
	var parentComment = undefined
	var replyComment = undefined
	topicComment.set('geoPoint', payload.geoPoint)
	topicComment.set('position', payload.position)
	topicComment.set('topic', topic)
	topicComment.set('user', user)
	topicComment.set('content', payload.content)

	if (payload.commentId&&payload.commentId!='') {
		parentComment = 	AV.Object.createWithoutData('TopicComments', payload.commentId)
		topicComment.set('parentComment', parentComment)
	}
	if(payload.replyId&&payload.replyId != ''){
		replyComment = 	AV.Object.createWithoutData('TopicComments', payload.replyId)
		topicComment.set('replyComment', replyComment)
	}

	topicComment.save().then((comment)=>{
		topic.increment("commentNum", 1)
		topic.save().then((topic)=>{
			if(payload.commentId&&payload.commentId!=''){
				parentComment.increment("commentCount",1)
				parentComment.save().then(()=>{
					var query = new AV.Query('TopicComments')
					query.include(['user']);
					query.include(['parentComment']);
					query.include(['parentComment.user']);
					query.include(['replyComment'])
					query.include(['replyComment.user'])
					query.get(comment.id).then((result)=>{
						var position = result.attributes.position
						var parentComment = result.attributes.parentComment
            var user = result.attributes.user
						var commentInfo = topicUtil.newTopicCommentFromLeanCloudObject(result)
						response.success(commentInfo)
					},(err)=>{
						response.error(err)
					})
				},(err)=>{
					response.error(err)
				})
			}else{
				var query = new AV.Query('TopicComments')
				query.include(['user']);
				query.include(['parentComment']);
				query.include(['parentComment.user']);
				query.get(comment.id).then((result)=>{
					var commentInfo = topicUtil.newTopicCommentFromLeanCloudObject(result)
					response.success(commentInfo)
				},(err)=>{
					response.error(err)
				})
			}
		},(err)=>{
			response.error(err)
		})
	},(err)=>{
		response.error(err)
	})

}

function topicPublishTopic(request,response) {
	var payload = request.params.payload
	var Topics = AV.Object.extend('Topics')
	var topic = new Topics()

	var topicCategory = AV.Object.createWithoutData('TopicCategory', payload.categoryId)
	var user = AV.Object.createWithoutData('_User', payload.userId)

	topic.set('geoPoint', payload.geoPoint)
	topic.set('position', payload.position)
	topic.set('city', payload.city)
	topic.set('district', payload.district)
	topic.set('province', payload.province)
	topic.set('category', topicCategory)
	topic.set('user', user)
	topic.set('imgGroup', payload.imgGroup)
	topic.set('content', payload.content)
	topic.set('title', payload.title)
	topic.set('abstract', payload.abstract)
	topic.set('commentNum', 0)
	topic.set('likeCount', 0)
	topic.save().then( (result)=> {
		var query = new AV.Query('Topics')
		query.include('user')
		query.include('category')
		query.get(result.id).then((item)=>{
			var topicInfo = topicUtil.newTopicFromLeanCloudObject(item)
			// console.log('result.====>',result)
			// console.log('topicInfo.====>',topicInfo)

			response.success(topicInfo)
		},(err)=>{
			response.error(err)
		})
	},  (err)=> {
		response.error(err)
	})
}

function topicUpdateTopic(request,response) {
	var payload = request.params.payload
	var topic = AV.Object.createWithoutData('Topics', payload.topicId)

	var topicCategory = AV.Object.createWithoutData('TopicCategory', payload.categoryId)

	topic.set('category', topicCategory)
	topic.set('imgGroup', payload.imgGroup)
	topic.set('content', payload.content)
	topic.set('title', payload.title)
	topic.set('abstract', payload.abstract)

	topic.save(null, {fetchWhenSave: true}).then(function (result) {
		var query = new AV.Query('Topics')
		query.include('user')
		query.include('category')
		query.get(result.id).then((item)=>{
			var topicInfo = topicUtil.newTopicFromLeanCloudObject(item)
			response.success(topicInfo)
		},(err)=>{
			response.error(err)
		})	},  (error)=> {
		response.error(error)
	})

}

var topicFunc = {
  disableTopicByUser: disableTopicByUser,
  fetchTopicComments: fetchTopicComments,
	getTopicComments: getTopicComments,
	fetchTopicList: fetchTopicList,
	fetchTopicDetailInfo: fetchTopicDetailInfo,
	fetchTopicCommentsV2: fetchTopicCommentsV2,
	fetchUserUps: fetchUserUps,
	upByUser: upByUser,
	pubulishTopicComment: pubulishTopicComment,
  fetchUpsByTopicId: fetchUpsByTopicId,
	topicPublishTopic: topicPublishTopic,
	topicUpdateTopic: topicUpdateTopic

}

module.exports = topicFunc