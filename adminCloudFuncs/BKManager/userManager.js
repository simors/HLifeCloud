/**
 * Created by lilu on 2017/2/18.
 */
var AV = require('leanengine');
var Promise = require('bluebird');


//去掉空格
function Trim(str) {
  return str.replace(/(^\s*)|(\s*$)/g, "");
}

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
              console.log('jhahahahahaha', userRole)
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
  var username=request.params.username
  var geoCity = request.params.geoCity
  var query = new AV.Query('_User')
  query.include('detail')
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
  query.find().then((results)=>{
    // console.log('results',results)

    var userList = []
    results.forEach((result)=>{
      // console.log('result',result)
      var userInfo= {
        id : result.id,
        identity:result.attributes.identity,
        enable:result.attributes.enable,
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
  var enable = request.params.enable
  var id = request.params.id
  var user = AV.Object.createWithoutData('_User',id)
  user.set('enable',enable)
  user.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
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
  updateAppUserEnable:updateAppUserEnable
}
module.exports = UserManagerFunc
