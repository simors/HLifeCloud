/**
 * Created by lilu on 2017/4/17.
 */
var AV = require('leanengine');
var Promise = require('bluebird')
var topicUtil = require('../../utils/topicUtil');

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


var topicFunc = {
  disableTopicByUser: disableTopicByUser,
  fetchTopicComments: fetchTopicComments,

}

module.exports = topicFunc