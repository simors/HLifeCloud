/**
 * Created by wuxingyu on 2016/12/10.
 */

var AV = require('leanengine');

function modifyMobilePhoneVerified(request, response) {
  var user = AV.Object.createWithoutData('_User',request.params.id)
  user.set("mobilePhoneVerified", true)
  user.save()
  response.success()
}

function verifyInvitationCode(request, response) {
  var invitationsCode = request.params.invitationsCode
  if(invitationsCode) {
    response.success('success')
  }else {
    response.error('error')
  }
}

function getDocterList(request, response) {
  let query = new AV.Query('_User')
  query.find().then((results) => {
    let userInfoList = []
    results.forEach((result) => {
      console.log(result.attributes)
      let userInfo = result.attributes
      userInfoList.push({
        username: userInfo.username,
        nickname: userInfo.nickname,
        phone: userInfo.mobilePhoneNumber,
        avatar: userInfo.avatar
      })
    })
    response.success(userInfoList)
  })
}

function getArticleLikers(request,response){
  let article= new AV.Object.createWithoutData('Articles',request.params.articleId)
  let relation = article.relation('likers')
  let query = relation.query()
  query.find().then(function (results) {
    if(results){
      response.success(results)
    }
      else{
        response.error('error')
    }
    
  })
}

var authFunc = {
  modifyMobilePhoneVerified: modifyMobilePhoneVerified,
  verifyInvitationCode: verifyInvitationCode,
  getDocterList: getDocterList,
  getArticleLikers:getArticleLikers,
}

module.exports = authFunc