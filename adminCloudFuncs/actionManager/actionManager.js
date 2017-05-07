/**
 * Created by lilu on 2017/3/17.
 */
var AV = require('leanengine');
var Promise = require('bluebird');

function getActionList(request, response) {
  // var createdAt = request.params.createdAt
  var orderMode = request.params.orderMode
  var geoCity = request.params.geoCity
  var geoDistrict = request.params.geoDistrict
  var actionType = request.params.actionType
  var status = request.params.status
  var query = new AV.Query('Banners')
  var liveArea = request.params.liveArea

  if (!request.params.startTime) {
    query.greaterThanOrEqualTo('createdAt', new Date('2016-9-28 00:00:00'));
    query.lessThan('createdAt', new Date());
  }
  else {
    query.greaterThanOrEqualTo('createdAt', request.params.startTime);
    query.lessThan('createdAt', request.params.endTime);
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
  if(liveArea){
    if(liveArea.length==2){
      query.contains('geoProvince',liveArea[1])
    }else if(liveArea.length==3){
      query.contains('geoCity',liveArea[2])
    }else if(liveArea.length==4){
      query.contains('geoDistrict',liveArea[3])
    }
  }
  if (status) {
    query.equalTo('status', status)
  }
  if (actionType) {
    query.equalTo('actionType', actionType)
  }
  if (geoDistrict) {
    query.equalTo('geoDistrict', geoDistrict)
  }
  if (geoCity) {
    query.equalTo('geoCity', geoCity)
  }
  var limit = request.params.limit ? request.params.limit : 100    // 默认只返回10条数据
  query.limit(limit)
  query.find().then((results)=> {
    var banners = []

    results.forEach((result)=> {
      var banner = {
        id: result.id,
        cityList: result.attributes.cityList,
        provinceList: result.attributes.provinceList,
        geoProvinceCodes:result.attributes.geoProvinceCodes,
        geoCityCodes:result.attributes.geoCityCodes,
        geo: result.attributes.geo,
        status: result.attributes.status,
        type: result.attributes.type,
        title: result.attributes.title,
        actionType: result.attributes.actionType,
        image: result.attributes.image,
        action: result.attributes.action,
        createdAt: result.createdAt
      }
      banners.push(banner)
    })
    response.success(banners)
  }, (err)=> {
    response.error(err)
  })

}

function updateBannersStatus(request, response) {
  var status = request.params.status
  var id = request.params.id
  var banners = AV.Object.createWithoutData('Banners', id)
  banners.set('status', status)
  banners.save().then(()=> {
    response.success()
  }, (err)=> {
    response.error(err)
  })
}

function createBanner(request, response) {
  var pushTargetDistrict = request.params.pushTargetDistrict;
  var pushTargetDistrictLabel = request.params.pushTargetDistrictLabel;
  var cityList=[]
  var provinceList=[]
  var geoCityCodes=[]
  var geoProvinceCodes=[]
  pushTargetDistrictLabel.forEach(function(item){
    var areaInfoArr = item.split('-');
    if('1' == areaInfoArr[0]) {
      provinceList.push (areaInfoArr[1])
    }else if('2' == areaInfoArr[0]) {
      cityList.push (areaInfoArr[1])
    }

  })
  pushTargetDistrict.forEach(function(item){
    var areaInfoArr = item.split('-');
    if('1' == areaInfoArr[0]) {
      geoProvinceCodes.push (areaInfoArr[1])
    }else if('2' == areaInfoArr[0]) {
      geoCityCodes.push (areaInfoArr[1])
    }

  })
  var Banner = AV.Object.extend('Banners')
  var banner = new Banner()
  banner.set('title', request.params.title)
  banner.set('cityList',cityList)
  banner.set('provinceList',provinceList)
  banner.set('geoCityCodes',geoCityCodes)
  banner.set('geoProvinceCodes',geoProvinceCodes)
  banner.set('geoCity', request.params.geoCity)
  banner.set('type', request.params.type)
  banner.set('status', 1)
  banner.set('actionType', request.params.actionType)
  banner.set('image', request.params.image)
  banner.set('geoDistrict', request.params.geoDistrict)
  banner.set('action', request.params.action)
  banner.save().then(()=> {
    response.success()
  }, (err)=> {
    response.error(err)
  })

}
function updateBanner(request, response) {
  var pushTargetDistrict = request.params.pushTargetDistrict;
  var pushTargetDistrictLabel = request.params.pushTargetDistrictLabel;
  var title = request.params.title
  // var geoCity = request.params.geoCity
  var type = request.params.type
  var actionType = request.params.actionType
  var image = request.params.image
  // var geoDistrict = request.params.geoDistrict
  var action = request.params.action
  var cityList=[]
  var provinceList=[]
  var geoCityCodes=[]
  var geoProvinceCodes=[]
  if(pushTargetDistrictLabel&&pushTargetDistrictLabel.length>0){
    pushTargetDistrictLabel.forEach(function(item){
      var areaInfoArr = item.split('-');
      if('1' == areaInfoArr[0]) {
        provinceList.push (areaInfoArr[1])
      }else if('2' == areaInfoArr[0]) {
        cityList.push (areaInfoArr[1])
      }

    })
  }
  if(pushTargetDistrict&&pushTargetDistrictLabel.length>0){
    pushTargetDistrict.forEach(function(item){
      var areaInfoArr = item.split('-');
      if('1' == areaInfoArr[0]) {
        geoProvinceCodes.push (areaInfoArr[1])
      }else if('2' == areaInfoArr[0]) {
        geoCityCodes.push (areaInfoArr[1])
      }

    })

  }

  var banner = AV.Object.createWithoutData('Banners', request.params.id)
  if(geoCityCodes){
    banner.set('getCityCodes',geoCityCodes)
  }
  if(geoProvinceCodes){
    banner.set('geoProvinceCodes',geoProvinceCodes)
  }
  if(provinceList){
    banner.set('provinceList',provinceList)
  }
  if(cityList){
    banner.set('cityList',cityList)
  }
  if (title) {
    banner.set('title', request.params.title)
  }
  // if (geoCity) {
  //   banner.set('geoCity', request.params.geoCity)
  //
  // }
  if (type!==undefined) {
    banner.set('type', request.params.type)

  }
  if (actionType) {
    banner.set('actionType', request.params.actionType)

  }
  if (image) {
    banner.set('image', request.params.image)

  }
  // if (geoDistrict) {
  //   banner.set('geoDistrict', request.params.geoDistrict)
  //
  // }
  if (action) {
    banner.set('action', request.params.action)

  }

  banner.save().then(()=> {
    response.success()
  }, (err)=> {
    response.error(err)
  })
}

var actionManageFunc = {
  getActionList: getActionList,
  updateBannersStatus: updateBannersStatus,
  createBanner: createBanner,
  updateBanner: updateBanner

}
module.exports = actionManageFunc
