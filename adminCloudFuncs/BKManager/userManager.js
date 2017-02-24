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
              role.attributes.role.attributes.name + '  '
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
        roleName: result.attributes.name + '  '
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
      console.log('role', result)
      var query = new AV.Query('_Role')
      result = Trim(result)
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
  AV.Query.doCloudQuery('delete from UserRole where adminUser = ' + user).then(()=> {

  })
}

function deleteUserFromAdmin(request, response) {
  //console.log('jhahaha',request.params.id)

  var user = AV.Object.createWithoutData('AdminUser', request.params.id)
  var query = new AV.Query('UserRole')
  query.equalTo('adminUser', user)
  query.find().then((results)=> {
    // console.log('results....',results)
    if (results&&results.length>0) {
      results.forEach((result)=> {
        var adminRole = AV.Object.createWithoutData('UserRole',result.id)
        adminRole.destroy()
      }).then((success)=> {
        user.destroy().then((success)=> {
          response.success(success)
        }, (err)=> {
          response.error(err)
        })
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

var UserManagerFunc = {
  getUserList: getUserList,
  getAllRoleList: getAllRoleList,
  addUserFromAdmin: addUserFromAdmin,
  deleteUserFromAdmin: deleteUserFromAdmin,
}
module.exports = UserManagerFunc
