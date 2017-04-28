
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

    		var nickname = userAttrs.nickname
    		// console.log('userAttrs====', userAttrs)
    		if(!nickname) {
    			var mobilePhoneNumber = userAttrs.mobilePhoneNumber
    			nickname = util.hidePhoneNumberDetail(mobilePhoneNumber)
    		}

    		upInfo.user = {
    			id: user.id,
    			nickname: nickname
    		}
    	}else if(['upType', 'targetId', 'status'].includes(key)) {
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
    	}else if(['content', 'lickCount', 'geoPoint', 'position'].includes(key)) {
    		topicComment[key] = attrs[key]	
    	}
    }

	}catch(error) {
    console.log('topicCommentFromLeancloudObject...error====', error)
  }

  return topicComment
}

var topicUtil = {
  topicCommentFromLeancloudObject: topicCommentFromLeancloudObject,
  upFromLeancloudObject: upFromLeancloudObject,
}

module.exports = topicUtil