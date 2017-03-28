/**
 * Created by zachary on 2017/3/22.
 */
var AV = require('leanengine');

function fetchSmsUserList(request, response) {
  // console.log('fetchSmsUserList------>>>>', request.params)

  var params = request.params;
  var area = params.area;
  var mobilePhoneNumber = params.mobilePhoneNumber;
  var nickname = params.nickname;
  var userType = params.userType;
  var username = params.username;

  var geoProvinceCode = '';
  var geoCityCode = '';
  var geoDistrictCode = '';
  if(area && area.length) {
    if(area.length > 1) {
      geoProvinceCode = area[1].split('-')[1]

      if(area.length > 2) {
        geoCityCode = area[2].split('-')[1]
      }

      if(area.length > 3) {
        geoDistrictCode = area[3].split('-')[1]
      }
    }
  }

  var query = new AV.Query('_User')

  if(mobilePhoneNumber) {
    query.contains('mobilePhoneNumber', mobilePhoneNumber)
  }

  if(nickname) {
    query.contains('nickname', nickname)
  }

  if(username) {
    query.contains('username', username)
  }

  if(userType == 2) {
    query.equalTo('identity', 'shopkeeper')
  }else if(userType == 3) {
    query.equalTo('identity', 'promoter')
  }

  if(geoProvinceCode) {
    query.contains('geoProvinceCode', geoProvinceCode)
  }

  if(geoCityCode) {
    query.contains('geoCityCode', geoCityCode)
  }

  if(geoDistrictCode) {
    query.contains('geoDistrictCode', geoDistrictCode)
  }

  query.equalTo('status', 1)

  query.find().then(function(results){
    if(results && results.length) {
      var userList = []
      results.forEach(function(item){
        var userInfo = {
          id: item.id
        }
        for(var key in item.attributes) {
          userInfo[key] = item.attributes[key]
        }
        userList.push(userInfo)
      })
      response.success(userList)
    }else {
      response.success([])
    }
    
  }, function(reason){
    response.success([])
  }).catch(function(error){
    response.success([])
  })
}


var smsManageFunc = {
  fetchSmsUserList: fetchSmsUserList
}
module.exports = smsManageFunc
