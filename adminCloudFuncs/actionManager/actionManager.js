/**
 * Created by lilu on 2017/3/17.
 */
var AV = require('leanengine');
var Promise = require('bluebird');

function getActionList(request,response){
  // var createdAt = request.params.createdAt
  var orderMode = request.params.orderMode
  var geoCity = request.params.geoCity
  var geoDistrict = request.params.geoDistrict
  var actionType = request.params.actionType
  var status = request.params.status
  var query = new AV.Query('Banners')

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
  if (status){
    query.equalTo('status',status)
  }
  if (actionType){
    query.equalTo('actionType',actionType)
  }
  if (geoDistrict){
    query.equalTo('geoDistrict',geoDistrict)
  }
  if (geoCity){
    query.equalTo('geoCity',geoCity)
  }
  query.find().then((results)=>{
    var banners= []

    results.forEach((result)=>{
      console.log('reuslt',result)
      var banner = {
        id:result.id,
        geoCity:result.attributes.geoCity,
        geoDistrict:result.attributes.geoDistrict,
        geo:result.attributes.geo,
        status:result.attributes.status,
        type:result.attributes.type,
        title:result.attributes.title,
        actionType:result.attributes.actionType,
        image:result.attributes.image,
        action:result.attributes.action,
        createdAt:result.createdAt
      }
      banners.push(banner)
    })
    response.success(banners)
  },(err)=>{
    response.error(err)
  })

}

function updateBannersStatus(request,response){
  var status = request.params.status
  var id = request.params.id
  var banners = AV.Object.createWithoutData('Banners',id)
  banners.set('status',status)
  banners.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}

function createBanner(request,response){
  var Banner = AV.Object.extend('Banners')
  var banner = new Banner()
  banner.set('title',request.title)
  banner.set('geoCity',request.geoCity)
  banner.set('type',request.type)
  banner.set('status',1)
  banner.set('actionType',request.actionType)
  banner.set('image',request.image)
  banner.set('geoDistrict',request.geoDistrict)
  banner.set('action',request.action)
  banner.save().then(()=>{
    response.success()
  },(err)=>{response.error(err)})

}

var actionManageFunc = {
  getActionList: getActionList,
  updateBannersStatus:updateBannersStatus,
  createBanner:createBanner

}
module.exports = actionManageFunc
