/**
 * Created by lilu on 2017/4/17.
 */
var AV = require('leanengine');
var Promise = require('bluebird')
var topicUtil = require('../../utils/topicUtil');
var util = require('../../utils/util');

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
	var query = new AV.Query('Topics')
	if (payload.type == "topics" && categoryId) {
		var category = AV.Object.createWithoutData('TopicCategory', categoryId);
		query.equalTo('category', category)
	}
	if (payload.userId && (payload.type == 'userTopics'||payload.type == "myTopics")) {
		var user = AV.Object.createWithoutData('_User', payload.userId)
		query.equalTo('user', user)
	}
	query.equalTo('status',1)
	if (payload.type == "pickedTopics") {
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
	query.descending('createdAt')
	return query.find().then(function (results) {
		var topicList = []
		results.forEach((result)=>{
			var user = result.attributes.user
			result.user=user
			topicList.push({topic:result,user:user})
		})
		response.success(topicList)
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
	var isRefresh = true
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
		var topicLikeUsers = []
		if (results) {
			results.forEach((result) => {
				var userInfo = result.attributes.user
				var user = {
					nickname:userInfo.attributes.nickname,
					userId:userInfo.id,
					createdAt:userInfo.createdAt,
					avatar:userInfo.attributes.avatar
				}
				topicLikeUsers.push(user)
			})
		}
		return topicLikeUsers
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
	var authorId = request.params.authorId
	var userId = request.params.userId
	var upType = 'topic'
	fetchOtherUserFollowersTotalCount({userId:authorId}).then((followers)=>{
		fetchTopicLikesCount({topicId:topicId,upType:upType}).then((likes)=>{
			fetchTopicLikeUsers({topicId:topicId,upType:upType}).then((likeUsers)=>{
				fetchUserLikeTopicInfo({userId:userId,topicId:topicId,upType:upType}).then((userUpShopInfo)=>{
					console.log('userUpShopInfo',userUpShopInfo)
					response.success({
						followers:followers,
						likes:likes,
						likeUsers:likeUsers,
						userUpShopInfo:userUpShopInfo,
					})
				},(err)=>{
					response.error(err)
				})
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
	query.descending('createdAt')
	query.find().then((results)=>{
		var topicCommentList = []
		var allComments = []
		var commentList = []
		results.forEach((result)=>{
			var position = result.attributes.position
			var parentComent = result.attributes.parentComment
			var topicComment = {
				content: result.attributes.content,
				commentId : result.id,
				topicId : result.attributes.topic.id,
				parentCommentContent : parentComent?result.attributes.parentComment.attributes.content:undefined,
				parentCommentUserName : parentComent?result.attributes.parentComment.attributes.user.attributes.username:undefined,
				parentCommentNickname : parentComent?result.attributes.parentComment.attributes.user.attributes.nickname:undefined,
				parentCommentId : parentComent?result.attributes.parentComment.id:undefined,
				upCount : result.attributes.likeCount,
				authorUsername : result.attributes.user.attributes.username,
				authorNickname : result.attributes.user.attributes.nickname,
				commentCount : result.attributes.commentCount,
				authorId : result.attributes.user.id,
				authorAvatar : result.attributes.user.attributes.avatar,
				createdAt : result.createdAt,
				address : position?position.address:undefined,
				city : position?position.city:undefined,
				longitude : position?position.longitude:undefined,
				latitude : position?position.latitude:undefined,
				streetNumber : position?position.streetNumber:undefined,
				street : position?position.street:undefined,
				province : position?position.province:undefined,
				country : position?position.country:undefined,
				district : position?position.district:undefined
			}
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
	query.find().then((results)=>{
		var commentList = []
		var topicList = []
		results.forEach((result)=>{
			if(result.attributes.upType == 'topicComment'){
				commentList.push(result.attributes.targetId)

			}else if(result.attributes.upType == 'topic'){
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
					response.success(item.attributes.targetId)
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

	topicComment.set('geoPoint', payload.geoPoint)
	topicComment.set('position', payload.position)
	topicComment.set('topic', topic)
	topicComment.set('user', user)
	topicComment.set('content', payload.content)

	if (payload.commentId&&payload.commentId!='') {
		parentComment = 	AV.Object.createWithoutData('TopicComments', payload.commentId)
		topicComment.set('parentComment', parentComment)
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
					query.get(comment.id).then((result)=>{
						var position = result.attributes.position
						var parentComent = result.attributes.parentComment
						var commentInfo = {
							content: result.attributes.content,
							commentId : result.id,
							topicId : result.attributes.topic.id,
							parentCommentContent : parentComent?result.attributes.parentComment.attributes.content:undefined,
							parentCommentUserName : parentComent?result.attributes.parentComment.attributes.user.attributes.username:undefined,
							parentCommentNickname : parentComent?result.attributes.parentComment.attributes.user.attributes.nickname:undefined,
							parentCommentId : parentComent?result.attributes.parentComment.id:undefined,
							upCount : result.attributes.likeCount,
							authorUsername : result.attributes.user.attributes.username,
							authorNickname : result.attributes.user.attributes.nickname,
							commentCount : result.attributes.commentCount,
							authorId : result.attributes.user.id,
							authorAvatar : result.attributes.user.attributes.avatar,
							createdAt : result.createdAt,
							address : position?position.address:undefined,
							city : position?position.city:undefined,
							longitude : position?position.longitude:undefined,
							latitude : position?position.latitude:undefined,
							streetNumber : position?position.streetNumber:undefined,
							street : position?position.street:undefined,
							province : position?position.province:undefined,
							country : position?position.country:undefined,
							district : position?position.district:undefined
						}
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
					var position = result.attributes.position
					var parentComent = result.attributes.parentComment
					var commentInfo = {
						content: result.attributes.content,
						commentId : result.id,
						topicId : result.attributes.topic.id,
						parentCommentContent : parentComent?result.attributes.parentComment.attributes.content:undefined,
						parentCommentUserName : parentComent?result.attributes.parentComment.attributes.user.attributes.username:undefined,
						parentCommentNickname : parentComent?result.attributes.parentComment.attributes.user.attributes.nickname:undefined,
						parentCommentId : parentComent?result.attributes.parentComment.id:undefined,
						upCount : result.attributes.likeCount,
						authorUsername : result.attributes.user.attributes.username,
						authorNickname : result.attributes.user.attributes.nickname,
						commentCount : result.attributes.commentCount,
						authorId : result.attributes.user.id,
						authorAvatar : result.attributes.user.attributes.avatar,
						createdAt : result.createdAt,
						address : position?position.address:undefined,
						city : position?position.city:undefined,
						longitude : position?position.longitude:undefined,
						latitude : position?position.latitude:undefined,
						streetNumber : position?position.streetNumber:undefined,
						street : position?position.street:undefined,
						province : position?position.province:undefined,
						country : position?position.country:undefined,
						district : position?position.district:undefined
					}
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

var topicFunc = {
  disableTopicByUser: disableTopicByUser,
  fetchTopicComments: fetchTopicComments,
	getTopicComments: getTopicComments,
	fetchTopicList:fetchTopicList,
	fetchTopicDetailInfo:fetchTopicDetailInfo,
	fetchTopicCommentsV2:fetchTopicCommentsV2,
	fetchUserUps:fetchUserUps,
	upByUser: upByUser,
	pubulishTopicComment:pubulishTopicComment

}

module.exports = topicFunc