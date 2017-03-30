/**
 * Created by yangyang on 2017/3/23.
 */
var AV = require('leanengine');
var redis = require('redis');
var Promise = require('bluebird');
var inviteCodeFunc = require('../util/inviteCode')
var IDENTITY_PROMOTER = require('../../constants/appConst').IDENTITY_PROMOTER
var GLOBAL_CONFIG = require('../../config')
var APPCONST = require('../../constants/appConst')

const PREFIX = 'promoter:'

var globalPromoterCfg = undefined     // 记录推广员系统配置参数

const defaultPromoterConfig = {
  agentTable: {
    province_agent: 0.1,
    city_agent: 0.2,
    district_agent: 0.3,
    street_agent: 0.4
  },
  upgradeTable: {
    promoter_level_1: {
      team: 100,
      shop: 200,
      royalty: [0.5, 0.1, 0.02]
    },
    promoter_level_2: {
      team: 500,
      shop: 1000,
      royalty: [0.5, 0.12, 0.02]
    },
    promoter_level_3: {
      team: 1000,
      shop: 3000,
      royalty: [0.5, 0.14, 0.02]
    },
    promoter_level_4: {
      team: 5000,
      shop: 10000,
      royalty: [0.5, 0.16, 0.02]
    },
    promoter_level_5: {
      team: 10000,
      shop: 30000,
      royalty: [0.5, 0.18, 0.02]
    },
  },
  invitePromoterRoyalty: 0.2,
}

// 初始化时获取配置信息
if (!globalPromoterCfg) {
  getPromoterConfig().then((syscfg) => {
    if (syscfg) {
      globalPromoterCfg = syscfg
      console.log('init global promoter config: ', globalPromoterCfg)
    }
  })
}

/**
 * 配置推广系统参数
 * @param request
 * @param response
 */
function setPromoterSysConfig(request, response) {
  var syscfg = request.params.promoterSysCfg
  if (!syscfg) {
    syscfg = defaultPromoterConfig
  }

  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    response.error({errcode: 1, message: '设置推广参数失败，请重试！'})
  })

  client.setAsync(PREFIX + "syscfg", JSON.stringify(syscfg)).then(() => {
    globalPromoterCfg = syscfg

    response.success({
      errcode: 0,
      message: '设置推广参数成功！',
    })
  })
}

function getPromoterConfig() {
  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  client.on('error', function (err) {
    console.log(err)
  })

  return client.getAsync(PREFIX + "syscfg").then((syscfg) => {
    return JSON.parse(syscfg)
  })
}

/**
 * 获取推广系统参数
 * @param request
 * @param response
 */
function fetchPromoterSysConfig(request, response) {
  getPromoterConfig().then((syscfg) => {
    if (syscfg) {
      response.success({errcode: 0, config: syscfg})
    } else{
      response.error({errcode: 1, message: '获取推广系统配置失败'})
    }
  })
}

/**
 * 用户认证为推广员
 * @param request
 * @param response
 */
function promoterCertificate(request, response) {
  var inviteCode = request.params.inviteCode
  inviteCodeFunc.verifyCode(inviteCode).then((reply) => {
    if (!reply) {
      response.error({
        errcode: 1,
        message: '验证码无效，请向推广员重新获取验证码',
      })
      return
    }
    var currentUser = request.currentUser
    var name = request.params.name
    var phone = request.params.phone
    var cardId = request.params.cardId
    var address = request.params.address
    var upUserId = reply

    var Promoter = AV.Object.extend('Promoter')
    var promoter = new Promoter()
    var upUser = AV.Object.createWithoutData('_User', upUserId)

    upUser.fetch().then((upUserInfo) => {
      promoter.set('name', name)
      promoter.set('phone', phone)
      promoter.set('cardId', cardId)
      promoter.set('user', currentUser)
      promoter.set('address', address)
      promoter.set('upUser', upUserInfo)
      promoter.set('payment', 0)      // 表示未完成支付
      promoter.set('shopEarnings', 0)
      promoter.set('royaltyEarnings', 0)
      promoter.set('inviteShopNum', 0)
      promoter.set('teamMemNum', 0)
      promoter.set('level', 1)

      currentUser.addUnique('identity', IDENTITY_PROMOTER)

      var incTeamMem = getPromoterByUserId(upUserId).then((upPromoter) => {
        incrementTeamMem(upPromoter.id)
      })

      Promise.all([currentUser.save(), incTeamMem]).then(() => {
        return promoter.save()
      }).then((promoterInfo) => {
        response.success({
          errcode: 0,
          message: '注册推广员成功',
          promoter: promoterInfo,
        })
      }).catch((err) => {
        console.log("promoterCertificate", err)
        response.error({
          errcode: 1,
          message: '注册推广员失败，请与客服联系',
        })
      })
    })
  })
}

/**
 * 获取到用户的上一级推广好友
 * @param request
 * @param response
 */
function getUpPromoter(request, response) {
  var userId = request.params.userId
  var user = AV.Object.createWithoutData('_User', userId)
  var query = new AV.Query('Promoter')
  query.equalTo('user', user)
  query.include('upUser')

  query.first().then((promoter) => {
    var upQuery = new AV.Query('Promoter')
    upQuery.equalTo('user', promoter.attributes.upUser)
    upQuery.include('user')
    upQuery.first().then((upPromoter) => {
      response.success({
        errcode: 0,
        promoter: upPromoter,
      })
    }, (err) => {
      response.error({
        errcode: 1,
        message: "无法获取到上一级推广好友"
      })
    })
  }, (err) => {
    response.error({
      errcode: 1,
      message: "无法获取到次用户的推广记录"
    })
  })
}

/**
 * 完成推广认证支付流程
 * @param request
 * @param response
 */
function finishPromoterPayment(request, response) {
  var promoterId = request.params.promoterId
  var promoter = AV.Object.createWithoutData('Promoter', promoterId)
  promoter.set('payment', 1)
  promoter.save().then((promoterInfo) => {
    response.success({
      errcode: 0,
      message: '完成支付',
      promoter: promoterInfo,
    })
  }, (err) => {
    response.error({
      errcode: 1,
      message: '支付异常',
    })
  })
}

/**
 * 根据用户id获取推广员信息的云函数内部调用函数
 * @param userId
 * @returns {Promise.<TResult>}
 */
function getPromoterByUserId(userId) {
  var user = AV.Object.createWithoutData('_User', userId)
  var query = new AV.Query('Promoter')
  query.equalTo('user', user)
  return query.first().then((promoterInfo) => {
    return promoterInfo
  })
}

/**
 * 通过用户id获取推广员信息
 * @param request
 * @param response
 */
function fetchPromoterByUser(request, response) {
  var userId = request.params.userId
  getPromoterByUserId(userId).then((promoterInfo) => {
    response.success({
      errcode: 0,
      promoter: promoterInfo,
    })
  }, (err) => {
    response.error({
      errcode: 1,
      message: "获取用户推广信息失败"
    })
  })
}

/**
 * 增加团队成员计数，同时判断推广员是否可以升级
 * @param promoterId
 * @returns {Promise.<TResult>}
 */
function incrementTeamMem(promoterId) {
  var promoter = AV.Object.createWithoutData('Promoter', promoterId)
  promoter.increment('teamMemNum', 1)
  return promoter.save(null, {fetchWhenSave: true}).then((promoterInfo) => {
    var query = new AV.Query('Promoter')
    query.get(promoterInfo.id).then((newPromoter) => {
      judgePromoterUpgrade(newPromoter, defaultUpgradeStandard)
    })
  })
}

/**
 * 增加邀请的店铺计数，同时判断推广员是否可以升级
 * @param promoterId
 * @returns {Promise.<TResult>}
 */
function incrementInviteShopNum(promoterId) {
  var promoter = AV.Object.createWithoutData('Promoter', promoterId)
  promoter.increment('inviteShopNum', 1)
  return promoter.save(null, {fetchWhenSave: true}).then((promoterInfo) => {
    var query = new AV.Query('Promoter')
    query.get(promoterInfo.id).then((newPromoter) => {
      judgePromoterUpgrade(newPromoter, defaultUpgradeStandard)
    })
  })
}

/**
 * 默认的判断推广员是否可以升级的方法
 * @param promoter
 * @returns {*}
 */
function defaultUpgradeStandard(promoter) {
  var level = promoter.attributes.level
  var teamMemNum = promoter.attributes.teamMemNum
  var inviteShopNum = promoter.attributes.inviteShopNum
  var team = 0
  var shop = 0
  switch (level) {
    case 1:
      team = globalPromoterCfg.upgradeTable.promoter_level_1.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_1.shop
      break
    case 2:
      team = globalPromoterCfg.upgradeTable.promoter_level_2.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_2.shop
      break
    case 3:
      team = globalPromoterCfg.upgradeTable.promoter_level_3.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_3.shop
      break
    case 4:
      team = globalPromoterCfg.upgradeTable.promoter_level_4.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_4.shop
      break
    default:    // 已经是最高级别
      return level
  }
  if (teamMemNum >= team && inviteShopNum >= shop) {
    level = level + 1
  }
  return level
}

/**
 * 判断推广员是否可升级，如果可以升级，则直接完成升级操作
 * @param promoterId
 */
function judgePromoterUpgrade(promoter, upgradeStandard) {
  if (upgradeStandard) {
    var newLevel = upgradeStandard(promoter)
    if (newLevel > promoter.attributes.level) {
      var newPromoter = AV.Object.createWithoutData('Promoter', promoter.id)
      newPromoter.set('level', newLevel)
      return newPromoter.save().then((promoterInfo) => {
        return promoterInfo
      })
    } else {
      return new Promise((resolve) => {
        resolve(promoter)
      })
    }
  } else {
    return new Promise((resolve) => {
      resolve(promoter)
    })
  }
}

var PromoterFunc = {
  fetchPromoterSysConfig: fetchPromoterSysConfig,
  setPromoterSysConfig: setPromoterSysConfig,
  promoterCertificate: promoterCertificate,
  getUpPromoter: getUpPromoter,
  finishPromoterPayment: finishPromoterPayment,
  fetchPromoterByUser: fetchPromoterByUser,
  incrementInviteShopNum, incrementInviteShopNum,
  getPromoterByUserId, getPromoterByUserId
}

module.exports = PromoterFunc