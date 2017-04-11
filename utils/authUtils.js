
var numberUtils = require('./numberUtils');
var util = require('./util');

function userInfoFromLeancloudObject(lcObj) {
	// console.log('userInfoFromLeancloudObject..====', lcObj)
	try{
		var userInfo = {}
		if(lcObj) {
			var attrs = lcObj.attributes
			userInfo.id = lcObj.id
			if(lcObj.getSessionToken) {
				userInfo.token = lcObj.getSessionToken()
			}

			var createdAt = lcObj.createdAt
			var updatedAt = lcObj.updatedAt

			var _createdAt = util.parseDate(createdAt)
      userInfo.createdAt = _createdAt.valueOf()
      userInfo.createdDate = numberUtils.formatLeancloudTime(_createdAt, 'YYYY-MM-DD HH:mm:SS')

      if(lcObj.userLoginAppDate) {
				var userLoginAppDate = lcObj.userLoginAppDate
				userInfo.updatedAt = userLoginAppDate.valueOf()
      	userInfo.updatedDate = numberUtils.formatLeancloudTime(userLoginAppDate, 'YYYY-MM-DD HH:mm:SS')
      	userInfo.lastLoginDuration = numberUtils.getConversationTime(userLoginAppDate.valueOf())
			}else {
				var _updatedAt = util.parseDate(updatedAt)
	      userInfo.updatedAt = _updatedAt.valueOf()
	      userInfo.updatedDate = numberUtils.formatLeancloudTime(_updatedAt, 'YYYY-MM-DD HH:mm:SS')
	      userInfo.lastLoginDuration = numberUtils.getConversationTime(_updatedAt.valueOf())
			}

			for(var key in attrs) {
				if (key == 'geo') {
					if(attrs.geo) {
						var geo = attrs.geo.toJSON()
						userInfo.geo = [geo.latitude, geo.longitude]
					}else{
						userInfo.geo = ''
					}
				}else {
					userInfo[key] = attrs[key]
				}
			}
		}
		return userInfo
	}catch(error) {
		console.log('userInfoFromLeancloudObject==error==', error)
		return {}
	}
}

function topicInfoFromLeancloudObject(lcObj) {
	try{
		var topicInfo = {}
		if(lcObj) {
			var attrs = lcObj.attributes
			topicInfo.id = lcObj.id

			var createdAt = lcObj.createdAt
			var updatedAt = lcObj.updatedAt

			// console.log('topicInfoFromLeancloudObject==lcObj==', lcObj)

			var _createdAt = util.parseDate(createdAt)
      topicInfo.createdAt = _createdAt.valueOf()
      topicInfo.createdDate = numberUtils.formatLeancloudTime(_createdAt, 'YYYY-MM-DD HH:mm:SS')

      var _updatedAt = util.parseDate(updatedAt)
      topicInfo.updatedAt = _updatedAt.valueOf()
      topicInfo.updatedDate = numberUtils.formatLeancloudTime(_updatedAt, 'YYYY-MM-DD HH:mm:SS')

			for(var key in attrs) {
				if('user' == key) {
					var user = {}
					user.id = attrs.user.id
					topicInfo.user = user
				}else {
					topicInfo[key] = attrs[key]
				}
			}
		}
		// console.log('topicInfoFromLeancloudObject==topicInfo==', topicInfo)
		return topicInfo
	}catch(error) {
		// console.log('topicInfoFromLeancloudObject==error==', error)
		return {}
	}
}

function userFolloweesConcatShopInfo(userFollowees, shopInfos) {
	if(userFollowees && userFollowees.length) {
		userFollowees.forEach((item)=>{
			if(shopInfos && shopInfos.length) {
				for(var i = 0; i < shopInfos.length; i++) {
					if(shopInfos[i].owner && item.id == shopInfos[i].owner.id) {
						item.shopInfo = shopInfos[i]
						shopInfos.splice(i, 1)
					}
				}
			}
		})
	}
}

function userFolloweesConcatTopicInfo(userFollowees, topicInfos) {
	if(userFollowees && userFollowees.length) {
		userFollowees.forEach((item)=>{
			if(topicInfos && topicInfos.length) {
				for(var i = 0; i < topicInfos.length; i++) {
					if(topicInfos[i].user && item.id == topicInfos[i].user.id) {
						item.latestTopic = topicInfos[i]
						topicInfos.splice(i, 1)
					}
				}
			}
		})
	}
}

var authUtils = {
  userInfoFromLeancloudObject: userInfoFromLeancloudObject,
  userFolloweesConcatShopInfo: userFolloweesConcatShopInfo,
  topicInfoFromLeancloudObject: topicInfoFromLeancloudObject,
  userFolloweesConcatTopicInfo: userFolloweesConcatTopicInfo,
}

module.exports = authUtils