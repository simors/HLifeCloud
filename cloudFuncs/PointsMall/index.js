/**
 * Created by yangyang on 2017/3/21.
 */
var AV = require('leanengine');
var Promise = require('bluebird');

var pointsActionTable = {
  REGIST: 200,                // 注册用户
  REGIST_PROMOTER: 200,
  REGIST_SHOPER: 200,
  PUBLISH_TOPIC: 50,
  PUBLISH_ACTIVITY: 20,
  PUBLISH_COMMENT: 10,
  INVIATE_PROMOTER: 100,
  INVIATE_SHOPER: 100,
}

function getUserPoint(request, response) {
  var userId = request.params.userId
  var user = AV.Object.createWithoutData('_User', userId)
  var query = new AV.Query('PointsMall')
  query.equalTo('user', user)
  query.first().then((userPoint) => {
    response.success({
      point: userPoint.attributes.point
    })
  }, (err) => {
    response.error({
      point: 0
    })
  })
}

function calUserRegist(request, response) {
  var userId = request.params.userId
  var PointsMall = AV.Object.extend('PointsMall')
  var pointsMall = new PointsMall()
  var query = new AV.Query('_User')
  query.get(userId).then((user) => {
    pointsMall.set('user', user)
    pointsMall.set('point', pointsActionTable.REGIST)
    pointsMall.save().then(() => {
      response.success({errcode: 0})
    })
  }, (error)=> {
    response.error({
      errcode: -1,
    })
  })
}

var PointsMallFunc = {
  calUserRegist: calUserRegist,
  getUserPoint: getUserPoint,
}

module.exports = PointsMallFunc