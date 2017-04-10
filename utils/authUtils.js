
var numberUtils = require('./numberUtils');
var util = require('./util');

function userInfoFromLeancloudObject(lcObj) {
	// console.log('userInfoFromLeancloudObject..====', lcObj)
	try{
		var userInfo = {}
		if(lcObj) {
			var attrs = lcObj.attributes
			userInfo.id = lcObj.id
			userInfo.token = lcObj.getSessionToken()

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
		console.log('userInfoFromLeancloudObject====', error)
		return {}
	}
}

var authUtils = {
  userInfoFromLeancloudObject: userInfoFromLeancloudObject,
}

module.exports = authUtils