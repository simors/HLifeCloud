/**
 * Created by lilu on 2017/2/8.
 */
var AV = require('leanengine');

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
      console.log('hahahahahah', result)

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
    console.log('hahahahahah', userId)

    var user = new AV.Object.createWithoutData('_User', userId)
    var role = new AV.Object.createWithoutData('_Role', roleId)
    var query = new AV.Query('UserRole')
    query.equalTo('role', role)
    query.equalTo('user', user)
    query.include('role')
    query.find().then((roleInfo)=> {
      //var role = new AV.Object.createWithoutData('_Role', roleId)
      console.log('hahahahahah', role)
      var query = new AV.Query('Privilege')
      query.equalTo('role', role)
      query.include('menu')
      query.find().then((results)=> {

        var menuList = []
        results.forEach((result)=> {
          console.log('hahahahahah', result)
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

var PrivilegeFunc = {
  getMenuList: getMenuList,
  getMenuListByLogin:getMenuListByLogin,
}


module.exports = PrivilegeFunc
