/**
 * Created by zachary on 2017/3/22.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var util = require('../../utils/util');

function push(request, response) {

  if(!request.params.pushContent) {
    response.error({
      code: -1,
      message: 'pushContent is null'
    })
  }else {
    var query = buildPushQuery(request.params)

    var data = buildPushData(request.params)

    _push(data, query)

    response.success({
      code: 1,
      message: 'push success'
    })
  }
}

/**
 * 推送
 * @param data
 *  alert: 通知内容(android & ios)
 *  title: 通知标题(android only)
 *  badge: 应用图标消息数量(ios only)
 *  sceneName: 点击通知跳转的Action名称
 *  sceneParams: 点击通知跳转指定Action传递的参数对象
 *  message_title: 消息中心列表展示标题
 *  message_abstract: 消息中心列表展示摘要
 *  message_cover_url: 消息中心列表展示封面图片url地址
 *  message_url: 点击标题跳转url地址
 *  prod: 指定发送iOS推送时,使用哪个环境下的证书(ios only)
 *  push_time: 定时推送时间;exp: new Date(Date.now() + (10 * 1000))  10秒后发送
 *  expiration_time: 推送过期时间
 *  expiration_interval: 从当前时间开始,多少秒之后过期
 * @param query
 *  自定义查询条件
 */
function _push(data, query) {
  var defaultData = {
    alert: '通知',
    title: '汇邻优店',
    prod: 'dev',
    sceneName: 'MESSAGE_BOX',
    sceneParams: {}
  }

  var actionData = {
    action: 'com.zachary.leancloud.push.action', //自定义推送,不需要设置频道
  }

  Object.assign(defaultData, data, actionData)

  var sendData = {
    prod: defaultData.prod || 'dev', //iOS 设备可以通过 prod 属性指定使用测试环境还是生产环境证书.dev 表示开发证书，prod 表示生产证书，默认生产证书。
    data: defaultData
  }
  query && (sendData.where = query)

  //推送时间
  if(Object.prototype.toString.call(data.push_time) === '[object Date]') {
    sendData.push_time = data.push_time
  }

  //推送过期时间
  if(Object.prototype.toString.call(data.expiration_time) === '[object Date]') {
    sendData.expiration_time = data.expiration_time
  }

  //从当前时间开始,多少秒之后过期
  if(Object.prototype.toString.call(data.expiration_interval) === '[object Number]') {
    sendData.expiration_interval = data.expiration_interval
  }

  AV.Push.send(sendData);
}

/**
 *  terminalType: 1,  // 1-不限; 2-iOS; 3-Android
 *  pushCondition: 1, //1-不限; 2-自定义
 *  inactivityDaysIsChecked: false, //是否根据未活跃天数进行推送
 *  inactivityDays: 30,  //未活跃天数
 *  pushTimeType: 1,   //1-现在; 2-指定时间
 *  pushTime: '',      //推送时间
 *  expireTimeType: 1, //1-从不; 2-指定时间; 3-指定间隔时间
 *  expireTime: '',    //过期时间
 *  expireIntervalTime: '1', //过期间隔时间
 *  expireIntervalTimeUnit: '1', //过期间隔时间单位; 1-小时; 2-天
 *  pushTargetUserType: '1', //1-不限; 2-店主; 3-推广员
 *  pushTargetDistrict: [],
 *  pushContentType: 1, //1-文本; 2-JSON
 *  pushContent: '',
 *  pushFileList: [],
 * @param params
 * @returns {*}
 */
function buildPushData(params) {
  var data = {}

  var prod = params.prod;
  var pushCondition = params.pushCondition;

  var pushTimeType = params.pushTimeType;
  var pushTime = params.pushTime;

  var expireTimeType = params.expireTimeType;
  var expireTime = params.expireTime;
  var expireIntervalTime = params.expireIntervalTime;
  var expireIntervalTimeUnit = params.expireIntervalTimeUnit;

  var pushContentType = params.pushContentType;
  var pushContent = params.pushContent;
  var message_cover_url = params.message_cover_url;

  if(prod == 'dev') {
    data.prod = 'dev'
  }else{
    data.prod = 'prod'
  }

  if(pushCondition == 2) {
    if(pushTimeType == 2) {
      data.push_time = new Date(pushTime)
    }

    if(expireTimeType == 2) {
      data.expiration_time = new Date(expireTime)
    }else if (expireTimeType == 3) {
      var expiration_interval = 1;
      if(expireIntervalTimeUnit == 2) {
        expiration_interval = parseInt(expireIntervalTime) * 24 * 60 * 60;
      }else {
        expiration_interval = parseInt(expireIntervalTime) * 60 * 60;
      }
      data.expiration_interval = expiration_interval;
    }
  }

  if(pushContentType == 2) {
    // console.log('pushContent....---->>>', pushContent)
    // console.log('pushContent....---->>>', typeof pushContent)
    pushContent = JSON.parse(pushContent)
    Object.assign(data, pushContent);
    // console.log('data....--****-->>>', data)
  }else {
    data.alert = pushContent;
  }

  data.message_cover_url = message_cover_url;

  return data;
}

/**
 *  terminalType: 1,  // 1-不限; 2-iOS; 3-Android
 *  pushCondition: 1, //1-不限; 2-自定义
 *  inactivityDaysIsChecked: false, //是否根据未活跃天数进行推送
 *  inactivityDays: 30,  //未活跃天数
 *  pushTimeType: 1,   //1-现在; 2-指定时间
 *  pushTime: '',      //推送时间
 *  expireTimeType: 1, //1-从不; 2-指定时间; 3-指定间隔时间
 *  expireTime: '',    //过期时间
 *  expireIntervalTime: '1', //过期间隔时间
 *  expireIntervalTimeUnit: '1', //过期间隔时间单位; 1-小时; 2-天
 *  pushTargetUserType: '1', //1-不限; 2-店主; 3-推广员
 *  pushTargetDistrict: [],
 *  pushContentType: 1, //1-文本; 2-JSON
 *  pushContent: '',
 *  pushFileList: [],
 * @param params
 * @returns {*}
 */
function buildPushQuery(params) {
  var query = new AV.Query('_Installation')

  var terminalType = params.terminalType;
  var pushCondition = params.pushCondition;
  var inactivityDaysIsChecked = params.inactivityDaysIsChecked;
  var inactivityDays = params.inactivityDays;
  var pushTargetUserType = params.pushTargetUserType;
  var pushTargetDistrict = params.pushTargetDistrict;

  if(terminalType == 2) {
    query.equalTo('deviceType', 'ios')
  }else if(terminalType == 3) {
    query.equalTo('deviceType', 'android')
  }

  if(pushCondition == 2) {
    if(inactivityDaysIsChecked) {
      if(inactivityDays) {
        var now = new Date();
        var newDate = util.DateAdd('day', -parseInt(inactivityDays), now);
        // console.log('newDate====<><><>', newDate)
        query.lessThanOrEqualTo('updatedAt', newDate);
      }
    }
  }

  if(pushTargetUserType == 2 || pushTargetUserType == 3
    || (pushTargetDistrict && pushTargetDistrict.length)) {

    var userTypeQuery = new AV.Query('_User');
    if(pushTargetUserType == 2) {
      userTypeQuery.equalTo('identity', 'shopkeeper');
    }else if(pushTargetUserType == 3) {
      userTypeQuery.equalTo('identity', 'promoter');
    }

    var districtOrQuery = new AV.Query('_User');
    if(pushTargetDistrict && pushTargetDistrict.length) {
      var districtQueryArr = []
      pushTargetDistrict.forEach(function(item){
        var areaInfoArr = item.split('-');
        var districtQuery = new AV.Query('_User');
        if('1' == areaInfoArr[0]) {
          districtQuery.equalTo('geoProvinceCode', areaInfoArr[1])
        }else if('2' == areaInfoArr[0]) {
          districtQuery.equalTo('geoCityCode', areaInfoArr[1])
        }
        districtQueryArr.push(districtQuery);
      })
      districtOrQuery = AV.Query.or.apply(null, districtQueryArr)
    }

    var andQuery = AV.Query.and(userTypeQuery, districtOrQuery);
    query.matchesQuery('owner', andQuery);
  }

  return query;
}

var pushManageFunc = {
  push: push
}
module.exports = pushManageFunc
