/**
 * Created by lilu on 2017/2/8.
 */
var AV = require('leanengine');
var Promise = require('bluebird');

function getMenuList(request, response) {
  var roleId = request.params.roleId
  // var roleId = '589ae46bb123db16a3b967df'
  var role = new AV.Object.createWithoutData('_Role', roleId)
  var query = new AV.Query('Privilege')
  query.equalTo('role', role)
  query.include('menu')
  query.find().then((results)=> {
    var menuList = []
    results.forEach((result)=> {

      menuList.push({
        menu: result.attributes.menu.attributes.name
      })
    })
    response.success(menuList)
  })
}

function getMenuListByLogin(request, response) {
  var phone = request.params.phone
  var password = request.params.password
  var roleId = request.params.roleId
  AV.User.logInWithMobilePhone(phone, password).then((userInfo)=> {

    var userId = userInfo.id

    var user = new AV.Object.createWithoutData('_User', userId)
    var role = new AV.Object.createWithoutData('_Role', roleId)
    var query = new AV.Query('UserRole')
    query.equalTo('role', role)
    query.equalTo('user', user)
    query.include('role')
    query.find().then((roleInfo)=> {
      //var role = new AV.Object.createWithoutData('_Role', roleId)
   //  console.log('hahahahahah', role)
      var query = new AV.Query('Privilege')
      query.equalTo('role', role)
      query.include('menu')
      query.find().then((results)=> {

        var menuList = []
        results.forEach((result)=> {
         // console.log('hahahahahah', result)
          menuList.push({
            menu: result.attributes.menu.attributes.name
          })
        })
        response.success(menuList)
      }, (err)=> {
        response.error(err)
      })
    }, (err)=> {
      response.error(err)
    })
  }, (err)=> {
    response.error(err)
  })
}

function getPermissionListOnlyByLogin(request, response) {
  var username = request.params.username
  var password = request.params.password
  var permssionList = []
  var query = new AV.Query('AdminUser')
  query.equalTo('username',username)
  query.equalTo('password',password)

 // var permissionList = new set()
 // var roleId = request.params.roleId
  query.first().then((userInfo)=> {

    var userId = userInfo.id

    var user = new AV.Object.createWithoutData('AdminUser', userId)
   // var role = new AV.Object.createWithoutData('_Role', roleId)
    var query = new AV.Query('UserRole')
   // query.equalTo('role', role)
    query.equalTo('adminUser', user)
    query.equalTo('enable', true)
    query.include('role')
    query.find().then((roles)=> {
      //var role = new AV.Object.createWithoutData('_Role', roleId)
     // console.log('hahahahahah', roles)

      var promises = []
      roles.forEach((roleInfo)=>{
        // console.log('hahahahahah', roleInfo.attributes.role.id)
        var role = new AV.Object.createWithoutData('_Role', roleInfo.attributes.role.id)
        // var permission = new AV.Object.createWithoutData('Permission', '58aede9fb123db0052b686da')

        var query = new AV.Query('Privilege')
        query.equalTo('role', role)
        // query.equalTo('permission', permission)
        query.include('permission')
        query.descending('createdAt')
        promises.push(
          query.find().then((results)=> {
          results.forEach((result)=> {

            // console.log('2', result.attributes.permission.attributes.subMenu)
            // console.log('3',result.attributes.permission.attributes.name)
            // console.log('4',result.attributes.permission.attributes.key)
            permssionList.push({
              subPermission: result.attributes.permission.attributes.subMenu,
              menu:result.attributes.permission.attributes.menu,

            name: result.attributes.permission.attributes.name,

            key:result.attributes.permission.attributes.key

            })
          })
          // response.success(menuList)
        }, (err)=> {
          response.error(err)
        }))


      })
      Promise.all(promises).then(()=>{
        response.success(permssionList)
      })
    }, (err)=> {
      response.error(err)
    })
  }, (err)=> {
    response.error(err)
  }).catch((error) => {
    response.error({error: 'password or username error'})
  })
}
var PrivilegeFunc = {
  getMenuList: getMenuList,
  getMenuListByLogin:getMenuListByLogin,
  getPermissionListOnlyByLogin:getPermissionListOnlyByLogin,
}


module.exports = PrivilegeFunc
