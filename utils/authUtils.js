
var numberUtils = require('./numberUtils');
var util = require('./util');

function userInfoFromLeancloudObject(lcObj) {
	console.log('userInfoFromLeancloudObject..====', lcObj)
	try{
		var userInfo = {}
		if(lcObj) {
			var attrs = lcObj.attributes
			userInfo.id = lcObj.id
			userInfo.token = lcObj.getSessionToken()
			for(var key in attrs) {
				if(key == 'createdAt') {
					var createdAt = util.parseDate(attrs.createdAt)
		      userInfo.createdAt = createdAt.valueOf()
		      userInfo.createdDate = numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD HH:mm:SS')
		      // userInfo.shopCommentTime = numberUtils.getConversationTime(createdAt.valueOf())
				}else if (key == 'updatedAt') {
					var updatedAt = util.parseDate(attrs.updatedAt)
		      userInfo.updatedAt = updatedAt.valueOf()
		      userInfo.updatedDate = numberUtils.formatLeancloudTime(updatedAt, 'YYYY-MM-DD HH:mm:SS')
				}else if (key == 'geo') {
					if(attrs.geo) {
						var geo = attrs.geo.toJSON()
						userInfo.geo = [geo.latitude, geo.longitude]
					}
				}else {
					userInfo[key] = attrs[key]
				}
			}
		}
		return userInfo
	}catch(error) {
		console.log('userInfoFromLeancloudObject====', error)
		return {}
	}
}

var authUtils = {
  userInfoFromLeancloudObject: userInfoFromLeancloudObject,
}

module.exports = authUtils