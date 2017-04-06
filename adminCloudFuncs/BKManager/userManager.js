/**
 * Created by lilu on 2017/2/18.
 */
var AV = require('leanengine');
var Promise = require('bluebird');


//去掉空格
// function Trim(str) {
//   return str.replace(/(^\s*)|(\s*$)/g, "");
// }

//获取人员名单
function getUserList(request, response) {
  var userList = []
  var promises = []
  var userQuery = new AV.Query('AdminUser')
  userQuery.find().then((results)=> {
    results.forEach((result)=> {
      console.log('result=====>', result)
      var query = new AV.Query('UserRole')

      var user = new AV.Object.createWithoutData('AdminUser', result.id)

      query.equalTo('adminUser', user)
      query.equalTo('enable', true)
      console.log('hahahahaha')

      query.include('role')

      promises.push(
        query.find().then((roles)=> {
          var roleList = []
          roles.forEach((role)=> {
            //    console.log('role=====>',role)

            roleList.push(
              role.attributes.role.attributes.name
            )
          })
          userList.push({
            id: result.id,
            username: result.attributes.username,
            password: result.attributes.password,
            roleList: roleList
          })
        })
      )
    })
    Promise.all(promises).then(()=> {
      response.success(userList)
    }, (err)=> {
      response.error(err)
    })

  }, (err)=> {
    response.error(err)
  })
}

function getAllRoleList(request, response) {
  var query = new AV.Query('_Role')
  var roleList = []
  query.find().then((results)=> {
    results.forEach((result)=> {
      var role = {
        roleId: result.id,
        roleName: result.attributes.name
      }
      roleList.push(role)
    })
    response.success(roleList)
  })
}

function addUserFromAdmin(request, response) {
  var username = request.params.name
  var password = request.params.password
  var roleList = request.params.roleList
  var promises = []
  //console.log('role',roleList)

  var AdminUser = AV.Object.extend('AdminUser')
  var adminUser = new AdminUser()
  adminUser.set('username', username)
  adminUser.set('password', password)
  adminUser.save().then((result)=> {
    var user = AV.Object.createWithoutData('AdminUser', result.id)
    roleList.forEach((result)=> {
      //  console.log('role', result)
      var query = new AV.Query('_Role')
      //result = Trim(result)
      query.equalTo('name', result)
      promises.push(query.first().then((roleInfo)=> {
        var role = AV.Object.createWithoutData('_Role', roleInfo.id)
        var userRole = new AV.Object('UserRole')
        userRole.set('role', role)
        userRole.set('adminUser', user)
        userRole.set('enable', true)
        userRole.save()
      }))

    })
    Promise.all(promises).then(()=> {
      response.success()
    }, (err)=> {
      response.error(err)
    })
  }, (err)=> {
    response.error(err)
  })
}

function updateUserFromAdmin(request, response) {
  var user = AV.Object.createWithoutData('AdminUser', request.params.key)
  var promises = []
  user.set('password', request.params.password)
  user.save().then(()=> {
    var query = new AV.Query('UserRole')
    query.equalTo('adminUser', user)
    query.find().then((results)=> {
        if (results) {
          results.forEach((result)=> {
              var adminRole = AV.Object.createWithoutData('UserRole', result.id)
              // console.log('hahahahahahaha',adminRole)
              adminRole.destroy()
              // console.log('hahahahahahaha')
            }
          )
        }
        //console.log(arr)
        var willRoles = []
        request.params.roleList.forEach((role)=> {
         // role = Trim(role)
          console.log('role', role, 'asd')
          var roleQuery = new AV.Query('_Role')
          roleQuery.equalTo('name', role)
          promises.push(
            roleQuery.first().then((roleInfo)=> {
              console.log('roleInfo', roleInfo)
              var roleObject = AV.Object.createWithoutData('_Role', roleInfo.id)
              var UserRole = AV.Object.extend('UserRole')
              var userRole = new UserRole()
              userRole.set('adminUser', user)
              userRole.set('role', roleObject)
              // console.log('jhahahahahaha', userRole)
              userRole.save()
            },
              (err)=> {
                response.error(err)
              }))
          // console.log('roleInfo',roleInfo)
        })
        // console.log('hahahahah', willRoles)
        Promise.all(promises).then(()=> {
          response.success()
        })
      },
      (err)=> {
        response.error(err)
      }
    )

  }, (err)=> {
    response.error(err)
  })


}

function deleteUserFromAdmin(request, response) {
  //console.log('jhahaha',request.params.id)

  var user = AV.Object.createWithoutData('AdminUser', request.params.id)
  var query = new AV.Query('UserRole')
  query.equalTo('adminUser', user)
  query.find().then((results)=> {
    // console.log('results....',results)
    if (results && results.length > 0) {
      results.forEach((result)=> {
        var adminRole = AV.Object.createWithoutData('UserRole', result.id)
        adminRole.destroy()
      })
        user.destroy().then((success)=> {
          response.success(success)
        }, (err)=> {
          response.error(err)
        })

    } else {
      // console.log('hahahahahahaha', user)
      user.destroy().then((success)=> {
        response.success(success)
      }, (err)=> {
        response.error(err)
      })
    }

  }, (err)=> {
    response.error(err)
  })

}

 function updateMyPassword(request,response) {
  var query = new AV.Query('AdminUser')
  query.equalTo('username',request.params.username)
  query.equalTo('password',request.params.password)
  query.first().then((result)=>{
   //console.log('hahaha',result.id)
    if(result){ var user = AV.Object.createWithoutData('AdminUser',result.id)
      user.set('password',request.params.newPassword)
      user.save().then((userInfo)=>{
        response.success({
          username:request.params.username,
          password:userInfo.attributes.password
        })
      },(err)=>{
        response.error(err)
      })}
   else{
     var err ='密码错误'
     response.error(err)
    }

  },(err)=>{
    response.error(err)
  })
}

//获取APP用户列表
function getAppUserList(request,response) {
  var orderMode = request.params.orderMode
  var status = request.params.status
  var username=request.params.username
  var geoCity = request.params.geoCity
  var query = new AV.Query('_User')
  var liveArea = request.params.liveArea
  query.include('detail')
  if(status==1){
    query.equalTo('status',status)
  }
  if (!request.params.startTime) {
    query.greaterThanOrEqualTo('createdAt', new Date('2016-9-28 00:00:00'));
    query.lessThan('createdAt', new Date());
  }
  else {
    query.greaterThanOrEqualTo('createdAt', request.params.startTime);
    query.lessThan('createdAt', request.params.endTime);
  }
  if(username){
    query.contains('username',username)
  }
  if(geoCity){
    query.contains('geoCity',geoCity)
  }
  if(liveArea){
    if(liveArea.length==2){
      query.contains('province',liveArea[1])
    }else if(liveArea.length==3){
      query.contains('city',liveArea[2])
    }else if(liveArea.length==4){
      query.contains('district',liveArea[3])
    }
  }
  if (orderMode == 'createTimeDescend') {
    query.descending('createdAt');
  }
  else if (orderMode == 'createTimeAscend') {
    query.ascending('createdAt');
  }
  else if (orderMode == 'likeCountDescend') {
    query.descending('likeCount');
  }
  else if (orderMode == 'commentNumDescend') {
    query.descending('commentNum');
  }
  else {
    query.descending('createdAt');
  }
  query.find().then((results)=>{
    // console.log('results',results)

    var userList = []
    results.forEach((result)=>{
      // console.log('result',result)
      var userInfo= {
        id : result.id,
        identity:result.attributes.identity,
        status:result.attributes.status,
        geoCity:result.attributes.geoCity,
        nickname:result.attributes.nickname,
        username:result.attributes.username,
        birthday:result.attributes.birthday,
        type:result.attributes.type,
        emailVerified:result.attributes.emailVerified,
        mobilePhoneNumber:result.attributes.mobilePhoneNumber,
        avatar:result.attributes.avatar,
        geoDistrict:result.attributes.geoDistrict,
        gender:result.attributes.gender,
        authData:result.attributes.authData,
        MobilePhoneVerified:result.attributes.mobilePhoneVerified,
        // detailId:result.attributes.detail.id,
        createdAt:result.createdAt
    }
    userList.push(userInfo)
    })
    response.success(userList)
  },(err)=>{
    response.error(err)
  })


}

function updateAppUserEnable(request,response){
  var status = request.params.status
  var id = request.params.id
  var user = AV.Object.createWithoutData('_User',id)
  user.set('status',status)
  user.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}

function getShopByUserId(request,response) {
  var userid = request.params.id
  var user = AV.Object.createWithoutData('_User',userid)
  var query = new AV.Query('Shop')
  query.equalTo('owner',user)
  query.include('owner')
  query.include('targetShopCategory')
  query.include('containedTag')
  query.first().then((result)=>{

    var tags = []
    // console.log('containedTag', result.attributes.containedTag)
    if (result.attributes.containedTag) {
      result.attributes.containedTag.forEach((tag)=> {
        var tagInfo = {
          id: tag.id,
          name: tag.attributes.name
        }
        tags.push(tagInfo)
      })
    }
    var targetShopCategory = {}
    if (result.attributes.targetShopCategory) {
      targetShopCategory = {
        text: result.attributes.targetShopCategory.attributes.text,
        id: result.attributes.targetShopCategory.id
      }
    }
    // console.log('result', result.attributes.owner)
    // var owner={}
    // if (result.attributes.owner) {
     var owner = {
        id: result.attributes.owner.id,
        username: result.attributes.owner.attributes.username
      }
    // }

    var shop={
      id:result.id,
      shopName:result.attributes.shopName,
      shopAddress:result.attributes.shopAddress,
      status:result.attributes.status,
      coverUrl:result.attributes.coverUrl,
      contactNumber:result.attributes.contactNumber,
      targetShopCategory:targetShopCategory,
      containedTag:tags,
      score:result.attributes.score,
      pv:result.attributes.pv,
      phone:result.attributes.phone,
      geoCity:result.attributes.geoCity,
      name:result.attributes.name,
      openTime:result.attributes.openTime,
      geoDistrict:result.attributes.geoDistrict,
      album:result.attributes.album,
      owner:owner,
      grade:result.attributes.grade,
      createdAt:result.createdAt
    }
    response.success(shop)
  },(err)=>{
    repsonse.error(err)
  })
}

var UserManagerFunc = {
  getUserList: getUserList,
  getAllRoleList: getAllRoleList,
  addUserFromAdmin: addUserFromAdmin,
  deleteUserFromAdmin: deleteUserFromAdmin,
  updateUserFromAdmin: updateUserFromAdmin,
  updateMyPassword:updateMyPassword,
  getAppUserList:getAppUserList,
  updateAppUserEnable:updateAppUserEnable,
  getShopByUserId:getShopByUserId
}
module.exports = UserManagerFunc
