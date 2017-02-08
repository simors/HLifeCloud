/**
 * Created by lilu on 2017/2/8.
 */
var AV = require('leanengine');

function getMenuList(request,response){
  var roleId = request.params.roleId
  var role = new AV.Object.createWithoutData('_Role', roleId)
  var query = new AV.Query('Privilege')
  query.equalTo('role',role)
  query.include('menu')
  query.find().then((results)=>{
    var menuList=[]
    results.forEach((result)=>{
      menuList.push({
        menu: result.name
      })
    })
    response.success(menuList)
  })
}


var PrivilegeFunc={
  getMenuList: getMenuList,
}

module.exports = PrivilegeFunc