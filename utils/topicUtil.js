
var numberUtils = require('./numberUtils');
var util = require('./util');

function upFromLeancloudObject(lcObj) {
	var upInfo = {}

	try {
		upInfo.id = lcObj.id

		var createdAt = util.parseDate(lcObj.createdAt)
    upInfo.createdAt = createdAt.valueOf()
    upInfo.createdDate = numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD')
    var updatedAt = util.parseDate(lcObj.updatedAt)
    upInfo.updatedAt = updatedAt.valueOf()

    var attrs = lcObj.attributes

    for(var key in attrs) {
    	if(key == 'user') {
    		var user = attrs.user
    		// console.log('user====', user)
    		var userAttrs = user.attributes
				var avatar = userAttrs.avatar
    		var nickname = userAttrs.nickname
    		// console.log('userAttrs====', userAttrs)
    		if(!nickname) {
    			var mobilePhoneNumber = userAttrs.mobilePhoneNumber
    			nickname = util.hidePhoneNumberDetail(mobilePhoneNumber)
    		}

    		upInfo.user = {
					avatar: avatar,
    			id: user.id,
    			nickname: nickname

    		}
    	}else if(['upType', 'targetId', 'status'].indexOf(key) != -1) {
    		upInfo[key] = attrs[key]
    	}
    }

	}catch(error) {
		console.log('upFromLeancloudObject...error====', error)
	}

	return upInfo
}

function topicCommentFromLeancloudObject(lcObj) {
	var topicComment = {}

	try{
		// console.log('lcObj====', lcObj)
		topicComment.objectId = lcObj.id;
		var createdAt = util.parseDate(lcObj.createdAt)
    topicComment.createdAt = createdAt.valueOf()
    topicComment.createdDate = numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD')
    // var updatedAt = util.parseDate(lcObj.updatedAt)
    // topicComment.updatedAt = updatedAt.valueOf()
    // topicComment.updatedDate = numberUtils.formatLeancloudTime(updatedAt, 'YYYY-MM-DD')

    var attrs = lcObj.attributes

    for(var key in attrs) {
    	if(key == 'parentComment') {
    		var parentCommentAttr = attrs.parentComment.attributes
    		topicComment.parentCommentContent = parentCommentAttr.content
    		var parentUser = parentCommentAttr.user
    		var parentUserAttrs = parentUser.attributes
    		var parentCommentUser = parentUserAttrs.nickname
    		if(!parentCommentUser) {
    			var mobilePhoneNumber = parentUserAttrs.mobilePhoneNumber
    			parentCommentUser = util.hidePhoneNumberDetail(mobilePhoneNumber)
    		}
    		topicComment.parentCommentUser = parentCommentUser
    	}else if(key == 'user') {
    		topicComment.userId = attrs.user.id
    		var userAttrs = attrs.user.attributes
    		var nickname = userAttrs.nickname
    		if(!nickname) {
    			var mobilePhoneNumber = userAttrs.mobilePhoneNumber
    			nickname = util.hidePhoneNumberDetail(mobilePhoneNumber)
    		}
    		topicComment.nickname = nickname
    		topicComment.avatar = userAttrs.avatar
    	}else if(['content', 'likeCount', 'geoPoint', 'position'].indexOf(key) != -1) {
    		topicComment[key] = attrs[key]	
    	}
    }

	}catch(error) {
    console.log('topicCommentFromLeancloudObject...error====', error)
  }

  return topicComment
}

function newTopicCommentFromLeanCloudObject(result){

	var position = result.attributes.position
	var parentComment = result.attributes.parentComment
	var replyComment = result.attributes.replyComment
	var user = result.attributes.user
	var comment = {
		content: result.attributes.content,
		commentId : result.id,
		topicId : result.attributes.topic.id,
		parentCommentContent : parentComment?result.attributes.parentComment.attributes.content:undefined,
		parentCommentUserName : parentComment?result.attributes.parentComment.attributes.user.attributes.username:undefined,
		parentCommentNickname : parentComment?result.attributes.parentComment.attributes.user.attributes.nickname:undefined,
		parentCommentId : parentComment?result.attributes.parentComment.id:undefined,
		replyCommentContent : replyComment?result.attributes.replyComment.attributes.content:undefined,
		replyCommentUserName : replyComment?result.attributes.replyComment.attributes.user.attributes.username:undefined,
		replyCommentNickname : replyComment?result.attributes.replyComment.attributes.user.attributes.nickname:undefined,
		replyCommentId : replyComment?result.attributes.replyComment.id:undefined,
		upCount : result.attributes.likeCount,
		authorUsername : user?result.attributes.user.attributes.username:undefined,
		authorNickname : user?result.attributes.user.attributes.nickname:undefined,
		commentCount : result.attributes.commentCount,
		authorId : user?result.attributes.user.id:undefined,
		authorAvatar : user?user.attributes.avatar:undefined,
		createdAt : result.createdAt,
		address : position?position.address:undefined,
		city : position?position.city:undefined,
		longitude : position?position.longitude:undefined,
		latitude : position?position.latitude:undefined,
		streetNumber : position?position.streetNumber:undefined,
		street : position?position.street:undefined,
		province : position?position.province:undefined,
		country : position?position.country:undefined,
		district : position?position.district:undefined,
		updatedAt : result.updatedAt,
		updatedDate : numberUtils.formatLeancloudTime(result.updatedAt, 'YYYY-MM-DD'),
		createdDate : numberUtils.formatLeancloudTime(result.createdAt, 'YYYY-MM-DD')
	}
	return comment
}

function newTopicFromLeanCloudObject(result) {
	var position = result.attributes.position
	var user = result.attributes.user
	var topic = {
		content: result.attributes.content, //话题内容
		title: result.attributes.title,
		abstract:result.attributes.abstract,
		imgGroup: result.attributes.imgGroup, //图片
		objectId: result.id,  //话题id
		categoryId: result.attributes.category.id,  //属于的分类
		categoryName: result.attributes.category.attributes.title, // 话题分类名
		nickname: user?result.attributes.user.attributes.nickname:undefined, //所属用户昵称
		username: user?result.attributes.user.attributes.username:undefined, //所属用户昵称
		userId:user?result.attributes.user.id:undefined,     // 所属用户的id
		createdAt: result.createdAt,  //创建时间
		avatar: user?result.attributes.user.attributes.avatar:undefined,  //所属用户头像
		commentNum: result.attributes.commentNum, //评论数
		likeCount: result.attributes.likeCount, //点赞数
		address : position?position.address:undefined,
		city : position?position.city:undefined,
		longitude : position?position.longitude:undefined,
		latitude : position?position.latitude:undefined,
		streetNumber : position?position.streetNumber:undefined,
		street : position?position.street:undefined,
		province : position?position.province:undefined,
		country : position?position.country:undefined,
		district : position?position.district:undefined,
		updatedAt : result.updatedAt,
		updatedDate : numberUtils.formatLeancloudTime(result.updatedAt, 'YYYY-MM-DD'),
		createdDate : numberUtils.formatLeancloudTime(result.createdAt, 'YYYY-MM-DD')
	}
	return topic
}


var topicUtil = {
  topicCommentFromLeancloudObject: topicCommentFromLeancloudObject,
  upFromLeancloudObject: upFromLeancloudObject,
	newTopicCommentFromLeanCloudObject: newTopicCommentFromLeanCloudObject,
	newTopicFromLeanCloudObject: newTopicFromLeanCloudObject,
}

module.exports = topicUtil