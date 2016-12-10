/**
 * Created by wuxingyu on 2016/12/10.
 */

var AV = require('leanengine');

function modifyMobilePhoneVerified(request, response) {
  var user = AV.Object.createWithoutData('_User',request.params.id)
  user.set("mobilePhoneVerified", true)
  user.save();
  response.success( "test")
}

var authFunc = {
  modifyMobilePhoneVerified: modifyMobilePhoneVerified,
}

module.exports = authFunc