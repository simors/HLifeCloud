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

function updateUserLocationInfo(request, response) {
  // console.log('updateUserLocationInfo.request.params=====', request.params)

  var userId = request.params.userId;

  var province = request.params.province;
  var provinceCode = request.params.provinceCode;

  var city = request.params.city;
  var cityCode = request.params.cityCode;

  var district = request.params.district;
  var districtCode = request.params.districtCode;

  var latitude = request.params.latitude;
  var longitude = request.params.longitude;
  var geoPoint = null
  if(latitude && longitude) {
    geoPoint = new AV.GeoPoint([latitude, longitude])
  }

  var userInfo = AV.Object.createWithoutData('_User', userId)
  if(province) {
    userInfo.set('geoProvince', province + "")
    userInfo.set('geoProvinceCode', provinceCode + "")
  }
  if(city) {
    userInfo.set('geoCity', city + "")
    userInfo.set('geoCityCode', cityCode + "")
  }
  if(district) {
    userInfo.set('geoDistrict', district + "")
    userInfo.set('geoDistrictCode', districtCode + "")
  }

  if(geoPoint) {
    userInfo.set('geo', geoPoint)
  }

  return userInfo.save().then(function(result){
    response.success(result)
  }, function(error){
    response.error('update fail', error)
  })
}

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
    response.error('fail')
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
  getDocterList: getDocterList,
  getDocterGroup: getDocterGroup,
  getUserinfoById: getUserinfoById,
  getUsers: getUsers,
  getArticleLikers: getArticleLikers,
  setUserNickname: setUserNickname,
  updateUserLocationInfo: updateUserLocationInfo
}

module.exports = authFunc