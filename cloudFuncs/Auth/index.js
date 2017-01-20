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
          userId: doctor.user.id,
          doctorId: result.id,
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

function getDocterGroup(request, response) {
  var userIds = request.params.id
  var query = new AV.Query('_User')
  query.containedIn('objectId', userIds)
  return query.find().then(function (users) {
    var queryDor = new AV.Query('Doctor')
    queryDor.include('user')
    queryDor.containedIn('user', users)
    queryDor.find().then(function (doctors) {
      var doctorList = []
      doctors.forEach((doctor) => {
        var doctorInfo = doctor.attributes
        var userInfo = doctorInfo.user.attributes
        doctorList.push({
        userId: doctorInfo.user.id,
        doctorId: doctor.id,
        username: doctorInfo.name,
        department: doctorInfo.department,
        phone: doctorInfo.phone,
        organization: doctorInfo.organization,
        avatar: userInfo.avatar,
      })
      })
      response.success(doctorList)
    })
  }, function (error) {
    error.message = ERROR[error.code] ? ERROR[error.code] : ERROR[9999]
    throw error
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

function getUsers(request, response) {
  var userIds = request.params.userIds
  var query = new AV.Query('_User')
  var rsp = {
    error: 0,     // 正常返回
    users: [],
  }
  query.containedIn('objectId', userIds)
  query.find().then(function (result) {
    result.forEach((userRes) => {
      var user = userRes.attributes
      var userInfo = {
        id: userRes.id,
        nickname: user.nickname ? user.nickname : user.mobilePhoneNumber,
        phone: user.mobilePhoneNumber,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        identity: user.identity,
      }
      rsp.users.push(userInfo)
    })
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
  getDocterGroup: getDocterGroup,
  getUserinfoById: getUserinfoById,
  getUsers: getUsers,
  getArticleLikers: getArticleLikers
}

module.exports = authFunc