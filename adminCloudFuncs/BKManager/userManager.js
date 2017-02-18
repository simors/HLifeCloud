/**
 * Created by lilu on 2017/2/18.
 */
var AV = require('leanengine');
var Promise = require('bluebird');

//获取人员名单
 function getUserList(request,response) {
   var userList = []
   var promises = []
  var userQuery = new AV.Query('AdminUser')
   userQuery.find().then((results)=>{
    results.forEach((result)=>{
      console.log('result=====>',result)
      var query =  new AV.Query('UserRole')

      var user = new AV.Object.createWithoutData('AdminUser',result.id)

      query.equalTo('adminUser',user)
      query.equalTo('enable',true)
      console.log('hahahahaha')

      query.include('role')

      promises.push(
      query.find().then((roles)=>{
       var roleList = []
        roles.forEach((role)=>{
          console.log('role=====>',role)

          roleList.push(
            role.attributes.role.attributes.name
          )
        })
        userList.push({
          username:result.attributes.username,
          password:result.attributes.password,
          roleList:roleList
        })
      })
      )
    })
     Promise.all(promises).then(()=>{
       response.success(userList)
     },(err)=>{
       response.error(err)
     })

   },(err)=>{
     response.error(err)
   })
}


var UserManagerFunc = {
  getUserList:getUserList
}
module.exports = UserManagerFunc
