/**
 * Created by zachary on 2017/3/22.
 */
var AV = require('leanengine');
var util = require('../../utils/util');
var numberUtils = require('../../utils/numberUtils');
var Promise = require('bluebird');

function fetchSmsUserList(request, response) {
  // console.log('fetchSmsUserList------>>>>', request.params)

  var params = request.params;
  var area = params.area;
  var mobilePhoneNumber = params.mobilePhoneNumber;
  var nickname = params.nickname;
  var userType = params.userType;
  var username = params.username;
  var pageNo = params.pageNo || 1;
  var pageSize = params.pageSize || 10;

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

  if(pageNo > 1) {
    query.skip( (pageNo - 1) * pageSize )
  }

  query.limit(pageSize)

  query.equalTo('status', 1)
  query.addDescending('createdAt')

  query.count().then(function(total){
    queryUserList(query).then(function(results){
      response.success({
        total: total,
        data: results,
        pageNo: pageNo,
        pageSize: pageSize
      })
    })
  }, function(error){
    queryUserList(query).then(function(results){
      response.success({
        total: results.total,
        data: results,
        pageNo: pageNo,
        pageSize: pageSize
      })
    })
  })
}

function queryUserList(query) {
  var userList = []
  return query.find().then(function(results){
    if(results && results.length) {
      results.forEach(function(item){
        var createdAt = util.parseDate(item.createdAt)
        var updatedAt = util.parseDate(item.updatedAt)
        var createdAtFormat = numberUtils.formatLeancloudTime(createdAt, 'YYYY-MM-DD HH:mm:SS')
        var updatedAtFormat = numberUtils.formatLeancloudTime(updatedAt, 'YYYY-MM-DD HH:mm:SS')
        var userInfo = {
          id: item.id,
          createdAt:  createdAt.valueOf(),
          updatedAt:  updatedAt.valueOf(),
          createdAtFormat: createdAtFormat,
          updatedAtFormat: updatedAtFormat
        }
        for(var key in item.attributes) {
          userInfo[key] = item.attributes[key]
        }
        userList.push(userInfo)
      })
    }
    return userList
  }, function(reason){
    return userList
  }).catch(function(error){
    return userList
  })
}

function sendSms(request, response) {
  // console.log('sendSms------>>>>', request.params)
  var params = request.params;
  var smsTemplateName = params.smsTemplateName;
  var mobilePhoneNumbers = params.mobilePhoneNumbers;

  if(smsTemplateName && mobilePhoneNumbers && mobilePhoneNumbers.length) {
    var promises = []
    mobilePhoneNumbers.forEach(function(mobilePhoneNumber){
      var promise = AV.Cloud.requestSmsCode({
        mobilePhoneNumber: mobilePhoneNumber,
        template: smsTemplateName
      })
      promises.push(promise)
    })

    Promise.all(promises).then(function(){
      response.success(true)
    }, function(){
      response.success(false)
    })
  }else {
    response.success(false)
  }
}

var smsManageFunc = {
  fetchSmsUserList: fetchSmsUserList,
  sendSms: sendSms
}
module.exports = smsManageFunc
