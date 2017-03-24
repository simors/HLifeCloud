/**
 * Created by zachary on 2017/3/22.
 */
var AV = require('leanengine');
var Promise = require('bluebird');

function push(request, response) {
  console.log('push------>>>>', request.params)

  var query = buildPushQuery(request.params)

  var data = {}

  _push(data, query)

  response.success(request.params)
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
    title: '邻家优店',
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

  console.log('push sendData=====', sendData)
  AV.Push.send(sendData);
}

/**
 * terminalType: 1,  // 1-不限; 2-iOS; 3-Android
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
 * @param queryParams
 * @returns {*}
 */
function buildPushQuery(queryParams) {
  var query = new AV.Query('_Installation')

  var deviceUserInfoQuery = new AV.Query('DeviceUserInfo')

  if(queryParams.terminalType == 2) {
    query.equalTo('deviceType', 'ios')
  }else if(queryParams.terminalType == 3) {
    query.equalTo('deviceType', 'android')
  }

  if(queryParams.pushCondition == 2) {
    if(queryParams.inactivityDaysIsChecked == 'true') {

    }
  }



}

var pushManageFunc = {
  push: push
}
module.exports = pushManageFunc
