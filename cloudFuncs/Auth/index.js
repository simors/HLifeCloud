/**
 * Created by wuxingyu on 2016/12/10.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var authUtils = require('../../utils/authUtils');
var shopUtil = require('../../utils/shopUtil');

/**
 * 构造response要返回的User信息
 * @param user
 */
function constructUserInfo(user) {
  if (!user) {
    return undefined
  }
  var userInfo = {}
  var userAttr = user.attributes
  if (!userAttr) {
    return undefined
  }
  userInfo.id = user.id
  userInfo.nickname = userAttr.nickname
  userInfo.username = userAttr.username
  userInfo.birthday = userAttr.birthday
  userInfo.phone = userAttr.mobilePhoneNumber
  userInfo.status = userAttr.status
  userInfo.avatar = userAttr.avatar
  userInfo.gender = userAttr.gender
  userInfo.identity = userAttr.identity
  userInfo.geo = userAttr.geo
  userInfo.geoProvince = userAttr.geoProvince
  userInfo.geoProvinceCode = userAttr.geoProvinceCode
  userInfo.geoCity = userAttr.getCity
  userInfo.geoCityCode = userAttr.geoCityCode
  userInfo.geoDistrict = userAttr.geoDistrict
  userInfo.geoDistrictCode = userAttr.geoDistrictCode
  return userInfo
}

function fetchUserFollowees(request, response) {
  var isRefresh = request.params.isRefresh
  var lastCreatedAt = request.params.lastCreatedAt
  var userId = request.params.userId

  var user = null
  if (userId) {
    user = AV.Object.createWithoutData('_User', userId)
  } else {
    user = request.currentUser
  }

  var query = new AV.Query('_Followee')

  query.equalTo('user', user)
  query.include(['followee'])
  query.addDescending('createdAt')
  query.limit(5) // 最多返回 5 条结果

  if (!isRefresh) { //分页查询
    if (!lastCreatedAt) {
      response.error({
        code: -3,
        message: 'lastCreatedAt为空'
      })
      return
    }
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  return query.find().then(function (results) {
    // console.log('_Followee.results====', results)

    try {
      var userFollowees = []

      if (results && results.length) {
        var shopOrQueryArr = []
        var topicOrQueryArr = []
        var followerQueryArr = []

        results.forEach((item, index) => {
          var attrs = item.attributes
          var followee = attrs.followee
          var userInfo = authUtils.userInfoFromLeancloudObject(followee)
          userFollowees.push(userInfo)

          var owner = AV.Object.createWithoutData('_User', userInfo.id)

          var shopQuery = new AV.Query('Shop')
          shopQuery.equalTo('owner', owner)
          shopQuery.equalTo('status', 1)
          shopOrQueryArr.push(shopQuery)

          var topicQuery = new AV.Query('Topics')
          topicQuery.equalTo('user', owner)
          topicQuery.equalTo('status', 1)
          topicQuery.addDescending('createdAt')
          topicQuery.limit(1)//最新发布的话题

          topicOrQueryArr.push(topicQuery.find())

          var followerQuery = new AV.Query('_Follower')
          followerQuery.equalTo('user', owner)
          followerQueryArr.push(followerQuery.count())
        })

        var shopOrQuery = AV.Query.or.apply(null, shopOrQueryArr)
        shopOrQuery.include(['targetShopCategory', 'inviter', 'containedTag', 'containedPromotions'])

        shopOrQuery.find().then((shopLcInfos)=> {
          // console.log('shopOrQuery...shopLcInfos=====', shopLcInfos)
          var shopInfos = shopUtil.shopFromLeancloudObject(shopLcInfos)
          authUtils.userInfosConcatShopInfo(userFollowees, shopInfos)
          // console.log('shopOrQuery...userFollowees=====', userFollowees)

          Promise.all(topicOrQueryArr).then((topicLcInfos)=> {
            // console.log('topicLcInfos===************', topicLcInfos)
            var topicInfos = []
            if (topicLcInfos && topicLcInfos.length) {
              topicLcInfos.forEach((topicLcInfo)=> {
                var topicInfo = authUtils.topicInfoFromLeancloudObject(topicLcInfo[0])
                topicInfos.push(topicInfo)
              })
              authUtils.userInfosConcatTopicInfo(userFollowees, topicInfos)
            }

            Promise.all(followerQueryArr).then((followersCounts)=> {
              // console.log('followersCounts====', followersCounts)
              userFollowees.forEach((item, index)=> {
                item.followersCounts = followersCounts[index]
              })

              response.success({
                code: 0,
                message: '成功',
                userFollowees: userFollowees,
              })
            }, (err)=> {
              response.success({
                code: 0,
                message: '成功',
                userFollowees: userFollowees,
              })
            })

          }, (err)=> {
            response.success({
              code: 0,
              message: '成功',
              userFollowees: userFollowees,
            })
          })

        }, (err)=> {

          response.success({
            code: 0,
            message: '成功',
            userFollowees: userFollowees,
          })
        })

      } else {
        response.success({
          code: 0,
          message: '成功',
          userFollowees: userFollowees
        })
      }

    } catch (error) {
      response.error({
        code: -2,
        message: err.message || '失败'
      })
    }

  }, function (err) {
    response.error({
      code: -1,
      message: err.message || '失败'
    })
  })
}

function fetchUserFollowers(request, response) {
  var isRefresh = request.params.isRefresh
  var lastCreatedAt = request.params.lastCreatedAt
  var userId = request.params.userId

  var user = null
  if (userId) {
    user = AV.Object.createWithoutData('_User', userId)
  } else {
    user = request.currentUser
  }

  var query = new AV.Query('_Follower')

  query.equalTo('user', user)
  query.include(['follower'])
  query.addDescending('createdAt')
  query.limit(5) // 最多返回 5 条结果

  if (!isRefresh) { //分页查询
    if (!lastCreatedAt) {
      response.error({
        code: -3,
        message: 'lastCreatedAt为空'
      })
      return
    }
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }

  return query.find().then(function (results) {
    // console.log('_Followee.results====', results)

    try {
      var userFollowers = []

      if (results && results.length) {
        var shopOrQueryArr = []
        var topicOrQueryArr = []
        var followerQueryArr = []

        results.forEach((item, index) => {
          var attrs = item.attributes
          var follower = attrs.follower
          var userInfo = authUtils.userInfoFromLeancloudObject(follower)
          userFollowers.push(userInfo)

          var owner = AV.Object.createWithoutData('_User', userInfo.id)

          var shopQuery = new AV.Query('Shop')
          shopQuery.equalTo('owner', owner)
          shopQuery.equalTo('status', 1)
          shopOrQueryArr.push(shopQuery)

          var topicQuery = new AV.Query('Topics')
          topicQuery.equalTo('user', owner)
          topicQuery.equalTo('status', 1)
          topicQuery.addDescending('createdAt')
          topicQuery.limit(1)//最新发布的话题

          topicOrQueryArr.push(topicQuery.find())

          var followerQuery = new AV.Query('_Follower')
          followerQuery.equalTo('user', owner)
          followerQueryArr.push(followerQuery.count())
        })

        var shopOrQuery = AV.Query.or.apply(null, shopOrQueryArr)
        shopOrQuery.include(['targetShopCategory', 'inviter', 'containedTag', 'containedPromotions'])

        shopOrQuery.find().then((shopLcInfos)=> {
          // console.log('shopOrQuery...shopLcInfos=====', shopLcInfos)
          var shopInfos = shopUtil.shopFromLeancloudObject(shopLcInfos)
          authUtils.userInfosConcatShopInfo(userFollowers, shopInfos)
          // console.log('shopOrQuery...userFollowers=====', userFollowers)

          Promise.all(topicOrQueryArr).then((topicLcInfos)=> {
            // console.log('topicLcInfos===************', topicLcInfos)
            var topicInfos = []
            if (topicLcInfos && topicLcInfos.length) {
              topicLcInfos.forEach((topicLcInfo)=> {
                var topicInfo = authUtils.topicInfoFromLeancloudObject(topicLcInfo[0])
                topicInfos.push(topicInfo)
              })
              authUtils.userInfosConcatTopicInfo(userFollowers, topicInfos)
            }

            Promise.all(followerQueryArr).then((followersCounts)=> {
              // console.log('followersCounts====', followersCounts)
              userFollowers.forEach((item, index)=> {
                item.followersCounts = followersCounts[index]
              })

              response.success({
                code: 0,
                message: '成功',
                userFollowers: userFollowers,
              })
            }, (err)=> {
              response.success({
                code: 0,
                message: '成功',
                userFollowers: userFollowers,
              })
            })

          }, (err)=> {
            response.success({
              code: 0,
              message: '成功',
              userFollowers: userFollowers,
            })
          })

        }, (err)=> {

          response.success({
            code: 0,
            message: '成功',
            userFollowers: userFollowers,
          })
        })

      } else {
        response.success({
          code: 0,
          message: '成功',
          userFollowers: userFollowers
        })
      }

    } catch (error) {
      response.error({
        code: -2,
        message: err.message || '失败'
      })
    }

  }, function (err) {
    response.error({
      code: -1,
      message: err.message || '失败'
    })
  })
}

function login(request, response) {
  var token = request.params.token;
  var phone = request.params.phone + '';
  var password = request.params.password + '';

  if (token) {
    AV.User.become(token).then((userLcObj) => {

      var currentDate = new Date()

      //1、即使更新失败，也需要返回用户登录信息，保证app可用性
      //2、如果新增字段保存用户登录app时间，那么更新此字段时，updatedAt也会更新，
      //从而新增的字段和updatedAt字段永远相同，因此可直接用updatedAt字段
      var user = AV.Object.createWithoutData('_User', userLcObj.id)
      user.set("updatedAt", currentDate)
      user.save()

      userLcObj.userLoginAppDate = currentDate

      // console.log('become.userLcObj====', userLcObj)
      var userInfo = authUtils.userInfoFromLeancloudObject(userLcObj)
      response.success({
        code: 1,
        user: userInfo,
        message: '自动登陆成功'
      })
    }, (err) => {
      response.error({
        code: -2,
        message: '自动登陆失败'
      })
    })
  } else if (phone && password) {
    AV.User.logInWithMobilePhone(phone, password).then((userLcObj) => {

      var currentDate = new Date()

      //1、即使更新失败，也需要返回用户登录信息，保证app可用性
      //2、如果新增字段保存用户登录app时间，那么更新此字段时，updatedAt也会更新，
      //从而新增的字段和updatedAt字段永远相同，因此可直接用updatedAt字段
      var user = AV.Object.createWithoutData('_User', userLcObj.id)
      user.set("updatedAt", currentDate)
      user.save()

      userLcObj.userLoginAppDate = currentDate
      // console.log('logInWithMobilePhone.userLcObj====', userLcObj)
      var userInfo = authUtils.userInfoFromLeancloudObject(userLcObj)
      response.success({
        code: 1,
        user: userInfo,
        message: '登陆成功'
      })
    }, (err) => {
      response.error({
        code: -1,
        message: '登陆失败'
      })
    })
  }
}

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
  if (latitude && longitude) {
    geoPoint = new AV.GeoPoint([latitude, longitude])
  }

  var userInfo = AV.Object.createWithoutData('_User', userId)
  if (province) {
    userInfo.set('geoProvince', province + "")
    userInfo.set('geoProvinceCode', provinceCode + "")
  }
  if (city) {
    userInfo.set('geoCity', city + "")
    userInfo.set('geoCityCode', cityCode + "")
  }
  if (district) {
    userInfo.set('geoDistrict', district + "")
    userInfo.set('geoDistrictCode', districtCode + "")
  }

  if (geoPoint) {
    userInfo.set('geo', geoPoint)
  }

  return userInfo.save().then(function (result) {
    response.success(result)
  }, function (error) {
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
      geo: user.geo,
      geoProvince: user.geoProvince,
      geoProvinceCode: user.geoProvinceCode,
      geoCity: user.geoCity,
      geoCityCode: user.geoCityCode,
      geoDistrict: user.geoDistrict,
      geoDistrictCode: user.geoDistrictCode
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
        geo: user.geo,
        geoProvince: user.geoProvince,
        geoProvinceCode: user.geoProvinceCode,
        geoCity: user.geoCity,
        geoCityCode: user.geoCityCode,
        geoDistrict: user.geoDistrict,
        geoDistrictCode: user.geoDistrictCode
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
        var likeInfo = result.attributes

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
  var avatarUri = request.params.avatarUri
  var user = AV.Object.createWithoutData('_User', userId)
  if (avatarUri) {
    user.set('avatar', avatarUri)
  }
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

function setUserOpenid(openid, unionid) {
  if(!openid || !unionid) {
    return Promise.reject()
  }

  var query = new AV.Query('_User')
  query.equalTo("authData.weixin.openid", unionid)
  query.doesNotExist('openid')

  return query.first().then((user) => {
    if(user) {
      user.set('openid', openid)
      return user.save()
    } else {
      return Promise.resolve()
    }
  }).catch((error) => {
    console.log('setUserOpenid:', error)
    throw error
  })
}

function getOpenidById(userId) {
  if(!userId) {
    return Promise.reject()
  }
  var user = AV.Object.createWithoutData('_User', userId)
  return user.fetch().then((userInfo) => {
    return userInfo.get('openid')
  }).catch((error) => {
    throw error
  })
}

function getNicknameById(userId) {
  if(!userId) {
    return Promise.reject()
  }
  var user = AV.Object.createWithoutData('_User', userId)
  return user.fetch().then((userInfo) => {
    return userInfo.get('nickname')
  }).catch((error) => {
    throw error
  })
}

function getUserById(userId) {
  var query = new AV.Query('_User')
  return query.get(userId)
}

function isSignInByUnionId(unionid) {
  var query = new AV.Query('_User')
  query.equalTo("authData.weixin.openid", unionid)
  return query.find().then((result) => {
    if(result.length >= 1) {
      return true
    } else {
      return false
    }
  }).catch((error) => {
    throw error
  })
}

/**
 * 通过微信unionid判断用户是否注册
 * @param request
 * @param response
 */
function isWXUnionIdSignIn(request, response) {
  var unionid = request.params.unionid

  if(!unionid)
    response.error({
      errcode: -1,
    })
  var query = new AV.Query('_User')
  query.equalTo("authData.weixin.openid", unionid)

  isSignInByUnionId(unionid).then((result) => {
    if(result) {
      response.success({
        isSignIn: true
      })
    } else {
      response.success({
        isSignIn: false
      })
    }
  }).catch((error) => {
    console.log('isSignInByUnionId', error)
    response.error({
      errcode: -1
    })
  })
}

/**
 * 现有账户绑定微信账户
 * @param request
 * @param response
 */
function bindWithWeixin(request, response) {
  var userId = request.params.userId
  var wx_name = request.params.name
  var wx_avatar = request.params.avatar
  var unionid = request.params.unionid
  var accessToken = request.params.accessToken
  var expiration = request.params.expiration

  var user = AV.Object.createWithoutData('_User', userId)

  var authData = {
    "openid": unionid,
    "access_token": accessToken,
    "expires_at": Date.parse(expiration),
  }
  var platform = 'weixin'

  AV.User.associateWithAuthData(user, platform, authData).then((authUser) => {
    if(authUser) {
      user.fetch().then(function (userInfo) {
        if(userInfo && userInfo.get('nickname'))
          userInfo.set('nickname', wx_name)
        if(userInfo && userInfo.get('avatar'))
          userInfo.set('avatar', wx_avatar)
        userInfo.save()
      })
    }


    return authUser
  }).then((bindUser) => {
    response.success({
      userInfo: bindUser
    })
  }).catch((err) => {
    console.log("bindWithWeixin", err)
    response.error({
      errcode: -1,
      message: '绑定微信失败'
    })
  })

}

/**
 * 通过手机号码判断用户是否绑定微信
 * @param request
 * @param response
 */
function isWXBindByPhone(request, response) {
  var phone = request.params.phone

  if(!phone)
    response.error({
      errcode: -1,
    })
  var query = new AV.Query('_User')
  query.equalTo("mobilePhoneNumber", phone)
  query.exists('authData')

  query.first().then((user) => {
    if(user) {
      response.success({
        wxAuthed: true
      })
    } else {
      response.success({
        wxAuthed: false
      })
    }
  }).catch((err) => {
    console.log(err)
    response.error({
      errcode: -1,
    })
  })
}

function authTest(request, response) {
  var userId = request.params.userId

  getUserById(userId).then((result) => {
    console.log("getUserById", result)
    response.success()
  })
}

var authFunc = {
  constructUserInfo: constructUserInfo,
  fetchUserFollowees: fetchUserFollowees,
  fetchUserFollowers: fetchUserFollowers,
  login: login,
  modifyMobilePhoneVerified: modifyMobilePhoneVerified,
  getDocterList: getDocterList,
  getDocterGroup: getDocterGroup,
  getUserinfoById: getUserinfoById,
  getUsers: getUsers,
  getArticleLikers: getArticleLikers,
  setUserNickname: setUserNickname,
  updateUserLocationInfo: updateUserLocationInfo,
  getUserById: getUserById,
  getNicknameById: getNicknameById,
  isWXUnionIdSignIn: isWXUnionIdSignIn,
  isSignInByUnionId: isSignInByUnionId,
  bindWithWeixin: bindWithWeixin,
  isWXBindByPhone: isWXBindByPhone,
  setUserOpenid: setUserOpenid,
  getOpenidById: getOpenidById,
  authTest: authTest
}

module.exports = authFunc