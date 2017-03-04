/**
 * Created by wuxingyu on 2016/12/10.
 */

var AV = require('leanengine');
var Promise = require('bluebird');

function modifyMobilePhoneVerified(request, response) {
  var user = AV.Object.createWithoutData('_User', request.params.id)
  user.set("mobilePhoneVerified", true)
  user.save()
  response.success()
}

function verifyInvitationCode(request, response) {
  var redis = require('redis');
  Promise.promisifyAll(redis.RedisClient.prototype);
  var client = redis.createClient(process.env['REDIS_URL_HLifeCache']);
// 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function(err) {
    console.log("error:", err)
  });
  var invitationsCode = request.params.invitationsCode
  if (invitationsCode) {
    client.getAsync(invitationsCode).then((reply) => {
      if (reply != null) {
        client.del(invitationsCode)
        response.success('success')
      }else {
        response.error('error')
      }
    })
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
          spec: doctor.spec,
          desc: doctor.desc,
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

function getInvitationCodeOnceSuccessCB(payload) {
  payload.response.success({
    status: 0,
    result: payload.result,
  })
}

var errCount = 0;

function getInvitationCodeOnceErrorCB(userId, err, response) {
  errCount  = errCount + 1
  if(errCount < 10) {
    getInvitationCodeOnce(userId, response)
  }else{
    response.success({
      status: err,
    })
  }
}

function getInvitationCodeOnce(userId, response) {
  var uuid = require('node-uuid');
  var redis = require('redis');
  Promise.promisifyAll(redis.RedisClient.prototype);
  var id = uuid.v4().substring(0, 8);
  var client = redis.createClient(process.env['REDIS_URL_HLifeCache']);
// 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function(err) {
    getInvitationCodeOnceErrorCB(userId, err, response);
  });
  client.getAsync(id).then((reply) => {
    if(reply==null) {
      client.setAsync(id, userId).then((reply) => {
        client.expire(id, 3600)
        getInvitationCodeOnceSuccessCB ({
          status: 0,
          result: id,
          response:response,
        })
      })
    }
    else{
      getInvitationCodeOnceErrorCB(userId, 1, response)
    }
  });
}

function getInvitationCode(request, response) {
  var userId = request.params.userId;
  getInvitationCodeOnce(userId, response)
}

function setUserNickname(request, response) {
  var userId = request.params.userId
  var nickname = request.params.nickname
  var user = AV.Object.createWithoutData('_User', userId)
  user.set('nickname', nickname)
  user.save().then(() => {
    response.success({
      errcode: 0,
    })
  }, (err) => {
    response.error({
      errcode: -1,
    })
  })
}

var authFunc = {
  modifyMobilePhoneVerified: modifyMobilePhoneVerified,
  verifyInvitationCode: verifyInvitationCode,
  getDocterList: getDocterList,
  getDocterGroup: getDocterGroup,
  getUserinfoById: getUserinfoById,
  getUsers: getUsers,
  getArticleLikers: getArticleLikers,
  getInvitationCode: getInvitationCode,
  setUserNickname: setUserNickname,
}

module.exports = authFunc