/**
 * Created by yangyang on 2017/3/21.
 */
var AV = require('leanengine');
var Promise = require('bluebird');

var pointsActionTable = {
  REGIST: 20,                // 注册用户
  REGIST_PROMOTER: 20,
  REGIST_SHOPER: 20,
  PUBLISH_TOPIC: 5,
  PUBLISH_ACTIVITY: 2,
  PUBLISH_COMMENT: 1,
  INVITE_PROMOTER: 10,
  INVITE_SHOPER: 10,
}

function pointIncrement(request, response, point) {
  var userId = request.params.userId
  var user = AV.Object.createWithoutData('_User', userId)
  var query = new AV.Query('PointsMall')
  query.equalTo('user', user)
  query.first().then((userPoint) => {
    var points = AV.Object.createWithoutData('PointsMall', userPoint.id)
    points.increment('point', point)
    points.save(null, {fetchWhenSave: true}).then((newPoints) => {
      response.success({
        point: newPoints.attributes.point
      })
    }, (err) => {
      response.error({
        point: 0
      })
    })
  }, (err) => {
    response.error({
      point: 0
    })
  })
}

function getUserPoint(request, response) {
  var userId = request.params.userId
  var user = AV.Object.createWithoutData('_User', userId)
  var query = new AV.Query('PointsMall')
  query.equalTo('user', user)
  query.first().then((userPoint) => {
    if (!userPoint) {
      response.error({
        point: 0
      })
      return
    }
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
    pointsMall.save().then((userPoint) => {
      response.success({
        errcode: 0,
        point: userPoint.attributes.point
      })
    })
  }, (error)=> {
    response.error({
      errcode: -1,
      point: 0,
    })
  })
}

function calRegistPromoter(request, response) {
  pointIncrement(request, response, pointsActionTable.REGIST_PROMOTER)
}

function calRegistShoper(request, response) {
  pointIncrement(request, response, pointsActionTable.REGIST_PROMOTER)
}

function calPublishTopic(request, response) {
  pointIncrement(request, response, pointsActionTable.PUBLISH_TOPIC)
}

function calPublishComment(request, response) {
  pointIncrement(request, response, pointsActionTable.PUBLISH_COMMENT)
}

function calPublishActivity(request,response) {
  pointIncrement(request, response, pointsActionTable.PUBLISH_ACTIVITY)
}

function calInvitePromoter(request, response) {
  pointIncrement(request, response, pointsActionTable.INVITE_PROMOTER)
}

function calInviteShoper(request, response) {
  pointIncrement(request, response, pointsActionTable.INVITE_SHOPER)
}

var PointsMallFunc = {
  calUserRegist: calUserRegist,
  getUserPoint: getUserPoint,
  calRegistPromoter: calRegistPromoter,
  calRegistShoper: calRegistShoper,
  calPublishTopic: calPublishTopic,
  calPublishComment: calPublishComment,
  calPublishActivity: calPublishActivity,
  calInvitePromoter: calInvitePromoter,
  calInviteShoper: calInviteShoper,
}

module.exports = PointsMallFunc