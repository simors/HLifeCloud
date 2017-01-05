/**
 * Created by wuxingyu on 2016/12/10.
 */

var AV = require('leanengine');

function modifyMobilePhoneVerified(request, response) {
  var user = AV.Object.createWithoutData('_User', request.params.id)
  user.set("mobilePhoneVerified", true)
  user.save()
  response.success()
}

function verifyInvitationCode(request, response) {
  var invitationsCode = request.params.invitationsCode
  if (invitationsCode) {
    response.success('success')
  } else {
    response.error('error')
  }
}

// function getDocterList(request, response) {
//   var query = new AV.Query('_User')
//   query.find().then((results) => {
//     var userInfoList = []
//     results.forEach((result) => {
//       var userInfo = result.attributes
//       userInfoList.push({
//         id: result.id,
//         username: userInfo.username,
//         nickname: userInfo.nickname,
//         phone: userInfo.mobilePhoneNumber,
//         avatar: userInfo.avatar
//       })
//     })
//     response.success(userInfoList)
//   })
// }

function getDocterList(request, response) {
  var query = new AV.Query('Doctor')
  query.include(['user'])
  query.find().then((results) => {
      var doctorList = []
      results.forEach((result) => {
        var doctor = result.attributes
        var userInfo = doctor.user.attributes
        // console.log("getDocterList userInfo:", userInfo)
        doctorList.push({
          id: result.id,
          username: doctor.name,
          department: doctor.department,
          phone: doctor.phone,
          organization: doctor.organization,
          avatar: userInfo.avatar,
        })
    })
    response.success(doctorList)
  })
}

function getUserinfoById(request, response) {
  var userId = request.params.userId
  var query = new AV.Query('_User')
  var rsp = {
    error: 0,     // 正常返回
  }
  query.get(userId).then((result) => {
    var user = result.attributes
    var userInfo = {
      id: result.id,
      nickname: user.nickname ? user.nickname : user.mobilePhoneNumber,
      phone: user.mobilePhoneNumber,
      avatar: user.avatar,
      gender: user.gender,
      birthday: user.birthday,
      identity: user.identity,
    }
    rsp.userInfo = userInfo
    response.success(rsp)
  }).catch((error) => {
    response.error({error: error.code})
  })
}

function getArticleLikers(request, response) {
  var article = new AV.Object.createWithoutData('Articles', request.params.articleId)
  var relation = article.relation('likers')
  var query = relation.query()
  var likersList = []
  query.find().then(function (results) {
    if (results) {
      results.forEach(function (result) {
        var likeInfo=result.attributes

        likersList.push({
          authorId: result.id,
          username: likeInfo.username,
          nickname: likeInfo.nickname,
          avatar: likeInfo.avatar,
        })
      })
      response.success(likersList)
    } else {
      response.error('error')
    }

  })
}

var authFunc = {
  modifyMobilePhoneVerified: modifyMobilePhoneVerified,
  verifyInvitationCode: verifyInvitationCode,
  getDocterList: getDocterList,
  getUserinfoById: getUserinfoById,
  getArticleLikers: getArticleLikers
}

module.exports = authFunc