/**
 * Created by yangyang on 2017/3/23.
 */
var AV = require('leanengine');
var redis = require('redis');
var Promise = require('bluebird');
var dateFormat = require('dateformat')
var inviteCodeFunc = require('../util/inviteCode')
var IDENTITY_PROMOTER = require('../../constants/appConst').IDENTITY_PROMOTER
var GLOBAL_CONFIG = require('../../config')
var APPCONST = require('../../constants/appConst')
var mysqlUtil = require('../util/mysqlUtil')
var wechatBoundOpenidFunc = require('../util/wechatBoundOpenid')
var WechatAPI = require('wechat-api');
var Request = require('request');
var fs = require('fs');
var images = require("images");
var mpMsgFuncs = require('../../mpFuncs/Message')
var authFunc = require('../../cloudFuncs/Auth')
var mpTokenFuncs = require('../../mpFuncs/Token')
// var gm = require('gm')
var gm = require('gm').subClass({imageMagick: true})
var mpQrcodeFuncs = require('../../mpFuncs/Qrcode')
var mpMaterialFuncs = require('../../mpFuncs/Material')
var util = require('../../cloudFuncs/util')





var wechat_api = new WechatAPI(GLOBAL_CONFIG.wxConfig.appid, GLOBAL_CONFIG.wxConfig.appSecret, mpTokenFuncs.getApiTokenFromRedis, mpTokenFuncs.setApiTokenToRedis);


const PREFIX = 'promoter:'

// 收益类型分类
const EARN_ROYALTY = 'royalty'  // 收入分成获取的收益
const EARN_SHOP_INVITE = 'shopinvite'   // 直接邀请店铺获得的收益

var globalPromoterCfg = undefined     // 记录推广员系统配置参数

const defaultPromoterConfig = {
  agentTable: {
    province_agent: 0.1,
    city_agent: 0.2,
    district_agent: 0.3,
    street_agent: 0.4
  },
  upgradeTable: {
    promoter_level_1: {     // 少尉
      team: 49,
      shop: 0,
      royalty: [0.5, 0.1, 0.02]
    },
    promoter_level_2: {     // 中尉
      team: 99,
      shop: 0,
      royalty: [0.5, 0.12, 0.02]
    },
    promoter_level_3: {     // 上尉
      team: 199,
      shop: 0,
      royalty: [0.5, 0.14, 0.02]
    },
    promoter_level_4: {     // 少校
      team: 499,
      shop: 0,
      royalty: [0.5, 0.16, 0.02]
    },
    promoter_level_5: {     // 中校
      team: 999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
    promoter_level_6: {     // 上校
      team: 1999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
    promoter_level_7: {     // 大校
      team: 4999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
    promoter_level_8: {     // 少将
      team: 9999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
    promoter_level_9: {     // 中将
      team: 19999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
    promoter_level_10: {     // 上将
      team: 49999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
    promoter_level_11: {     // 少帅
      team: 99999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
    promoter_level_12: {     // 中帅
      team: 199999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
    promoter_level_13: {     // 大帅
      team: 99999999,
      shop: 0,
      royalty: [0.5, 0.18, 0.02]
    },
  },
  invitePromoterRoyalty: [0.2, 0.05, 0.02],       // 推广员入驻费提成比例
  promoterCharge: 8.8,              // 推广员入驻费
  minShopkeeperCharge: 58,          // 店铺入驻最低费用
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
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    response.error({errcode: 1, message: '设置推广参数失败，请重试！'})
  })

  client.setAsync(PREFIX + "syscfg", JSON.stringify(syscfg)).then(() => {
    globalPromoterCfg = syscfg

    console.log('set promoter config: ', globalPromoterCfg)

    response.success({
      errcode: 0,
      message: '设置推广参数成功！',
    })
  }).finally(() => {
    client.quit()
  })
}

function getPromoterConfig() {
  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  client.on('error', function (err) {
    console.log(err)
  })

  return client.getAsync(PREFIX + "syscfg").then((syscfg) => {
    return JSON.parse(syscfg)
  }).finally(() => {
    client.quit()
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
 * 获取推广员的邀请码
 * @param promoterId
 * @returns {Promise.<TResult>|*}
 */
function getPromoterInviteCode(promoterId) {
  return getPromoterById(promoterId).then((promoterInfo) => {
    return promoterInfo.attributes.inviteCode
  })
}

/**
 * 根据邀请码获取推广员信息
 * @param code
 * @returns {*}
 */
function getPromoterByInviteCode(code) {
  var query = new AV.Query('Promoter')
  query.equalTo('inviteCode', code)
  return query.first()
}

/**
 * 保存推广员的邀请码
 * @param promoterId
 * @param inviteCode
 * @returns {Promise.<Conversation>|Promise<Conversation>|*}
 */
function savePromoterInviteCode(promoterId, inviteCode) {
  var promoter = AV.Object.createWithoutData('Promoter', promoterId)
  promoter.set('inviteCode', inviteCode)
  return promoter.save()
}

/**
 * 微信用户注册同步推广员信息表
 * @param request
 * @param response
 */
function syncPromoterInfo(request, response) {
  var userId = request.params.userId
  var upUserOpenid = undefined

  bindPromoterInfo(userId).then((upUser) => {
    if(upUser) {
      upUserOpenid = upUser.attributes.openid
      return authFunc.getUserById(userId)
    } else {
      return undefined
    }
  }).then((leanUser) => {
    if(leanUser) {
      var nickname = leanUser.attributes.nickname
      var city = leanUser.attributes.geoCity
      mpMsgFuncs.sendInviterTmpMsg(upUserOpenid, nickname, city)
    }
    response.success()
  }).catch((error) => {
    response.error(error)
  })
}

function createPromoter(userId) {
  var currentUser = AV.Object.createWithoutData('_User', userId)
  var Promoter = AV.Object.extend('Promoter')

  var currentUserInfo = undefined
  var promoterQuery = new AV.Query('Promoter')


  return currentUser.fetch().then((userInfo) => {
    currentUserInfo = userInfo
    promoterQuery.equalTo('user', userInfo)
    return promoterQuery.first()
  }).then((promoter) => {
    if(promoter) {
      return promoter
    } else {
      promoter = new Promoter()
      promoter.set('user', currentUserInfo)
      promoter.set('liveProvince', "")
      promoter.set('liveCity', "")
      promoter.set('liveDistrict', "")
      promoter.set('payment', 1)
      promoter.set('shopEarnings', 0)
      promoter.set('royaltyEarnings', 0)
      promoter.set('inviteShopNum', 0)
      promoter.set('teamMemNum', 0)
      promoter.set('level', 1)
      promoter.set('province', "")
      promoter.set('city', "")
      promoter.set('district', "")
      promoter.set('street', "")
      return promoter.save()
    }
  }).catch((error) => {
    throw error
  })
}

function getUpUserFromRedis(userId) {
  var currentUser = AV.Object.createWithoutData('_User', userId)

  return currentUser.fetch().then((userInfo) => {
    var authData = userInfo.get('authData')
    var currentUserUnionid = authData.weixin.openid
    return wechatBoundOpenidFunc.getUpUserUnionid(currentUserUnionid)
  }).then((unionId) => {
    if(unionId) {
      var userQuery = new AV.Query('_User')
      userQuery.equalTo('authData.weixin.openid', unionId)
      return userQuery.first()
    } else {
      return undefined
    }
  }).catch((error) => {
    throw error
  })
}

function bindPromoterInfo(userId) {
  var currentPromoter = undefined
  var upUser = undefined

  return createPromoter(userId).then((promoter) => {
    currentPromoter = promoter
    return getUpUserFromRedis(userId)
  }).then((user) => {
    if(user) {
      upUser = user
      currentPromoter.set('upUser', upUser)
      var incTeamMem = getPromoterByUserId(upUser.id).then((upPromoter) => {
        incrementTeamMem(upPromoter.id)
      }).catch((err) => {
        throw err
      })
      return Promise.all([currentPromoter.save(), incTeamMem])
    } else {
      return undefined
    }

  }).then(() => {
    insertPromoterInMysql(currentPromoter.id)
    return upUser
  }).catch((error) => {
    throw error
  })

}

/**
 * 用户认证为推广员
 * @param request
 * @param response
 */
function promoterCertificate(request, response) {
  var inviteCode = request.params.inviteCode
  var currentUser = request.currentUser
  var phone = request.params.phone
  var liveProvince = request.params.liveProvince
  var liveCity = request.params.liveCity
  var liveDistrict = request.params.liveDistrict

  var existQuery = new AV.Query('Promoter')
  existQuery.equalTo('user', currentUser)
  existQuery.first().then((promoter) => {
    if (promoter) {
      response.error({
        errcode: 1,
        message: '此用户已经是推广员，不能重复注册',
      })
    } else {
      inviteCodeFunc.verifyCode(inviteCode).then((reply) => {
        if (!reply) {
          response.error({
            errcode: 1,
            message: '邀请码无效，请向推广员重新获取邀请码',
          })
          return
        }

        var upUserId = reply

        var Promoter = AV.Object.extend('Promoter')
        var promoter = new Promoter()
        var upUser = AV.Object.createWithoutData('_User', upUserId)

        upUser.fetch().then((upUserInfo) => {
          promoter.set('phone', phone)
          promoter.set('user', currentUser)
          promoter.set('liveProvince', liveProvince)
          promoter.set('liveCity', liveCity)
          promoter.set('liveDistrict', liveDistrict)
          promoter.set('upUser', upUserInfo)
          promoter.set('payment', 0)      // 表示未完成支付
          promoter.set('shopEarnings', 0)
          promoter.set('royaltyEarnings', 0)
          promoter.set('inviteShopNum', 0)
          promoter.set('teamMemNum', 0)
          promoter.set('level', 1)
          promoter.set('identity', APPCONST.AGENT_NONE)
          promoter.set('province', "")
          promoter.set('city', "")
          promoter.set('district', "")
          promoter.set('street', "")

          currentUser.addUnique('identity', IDENTITY_PROMOTER)

          var incTeamMem = getPromoterByUserId(upUserId).then((upPromoter) => {
            incrementTeamMem(upPromoter.id)
          }).catch((err) => {
            console.log(err)
            response.error({
              errcode: 1,
              message: '注册推广员失败，找不到上级好友的推广信息',
            })
          })
          var newPromoter = undefined

          Promise.all([currentUser.save(), incTeamMem]).then(() => {
            return promoter.save()
          }).then((promoterInfo) => {
            newPromoter = promoterInfo
            return insertPromoterInMysql(promoterInfo.id)
          }).then(() => {
            response.success({
              errcode: 0,
              message: '注册推广员成功',
              promoter: newPromoter,
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
  }, (err) => {
    console.log('find promoter exist error:', err)
    response.error({
      errcode: 1,
      message: '查询推广员失败，请重试',
    })
  }).catch((err) => {
    response.error({
      errcode: 1,
      message: '注册推广员失败，请与客服联系',
    })
  })
}

/**
 * 在mysql中插入推广员记录
 * @param promoterId
 * @returns {Promise.<T>}
 */
function insertPromoterInMysql(promoterId) {
  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PromoterEarnings` WHERE `promoterId` = ? LIMIT 1"
    return mysqlUtil.query(conn, sql, [promoterId])
  }).then((queryRes) => {
    if (queryRes.results[0].cnt == 0) {
      sql = "INSERT INTO `PromoterEarnings` (`promoterId`, `shop_earnings`, `royalty_earnings`) VALUES (?, 0, 0)"
      return mysqlUtil.query(queryRes.conn, sql, [promoterId])
    } else {
      return new Promise((resolve) => {
        resolve()
      })
    }
  }).catch((err) => {
    throw err
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
  })
}

/**
 * 获取到上级推广员
 * @param promoter
 * @param includeUser  是否关联查询用户及上级推广员用户信息
 */
function getUpPromoter(promoter, includeUser) {
  if (!promoter) {
    return new Promise((resolve, reject) => {
      reject()
    })
  }
  if (!promoter.attributes.upUser) {
    return new Promise((resolve, reject) => {
      resolve(undefined)
    })
  }
  var upQuery = new AV.Query('Promoter')
  upQuery.equalTo('user', promoter.attributes.upUser)
  if (!includeUser) {
    includeUser = false
  }
  if (includeUser) {
    upQuery.include('user')
    upQuery.include('upUser')
  }
  return upQuery.first()
}

/**
 * 获取到用户的上一级推广好友
 * @param request
 * @param response
 */
function getUpPromoterByUserId(request, response) {
  var userId = request.params.userId

  var user = AV.Object.createWithoutData('_User', userId)
  var query = new AV.Query('Promoter')

  query.equalTo('user', user)
  query.include('upUser')

  query.first().then((promoter) => {
    getUpPromoter(promoter, true).then((upPromoter) => {
      if (!upPromoter) {
        response.success({
          errcode: 2,
          message: '不存在此用户的上级推广员'
        })
        return
      }
      var constructUserInfo = require('../Auth').constructUserInfo
      response.success({
        errcode: 0,
        promoter: upPromoter,
        user: constructUserInfo(upPromoter.attributes.user)
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
      message: "无法获取到此用户的推广记录"
    })
  })
}

/**
 * 推广员注册完成支付
 * @param promoterId
 * @returns {Promise.<Conversation>|Promise<Conversation>|*}
 */
function promoterPaid(promoterId) {
  var promoter = AV.Object.createWithoutData('Promoter', promoterId)
  promoter.set('payment', 1)
  return promoter.save()
}

/**
 * 完成推广认证支付流程
 * @param request
 * @param response
 */
function finishPromoterPayment(request, response) {
  var promoterId = request.params.promoterId
  promoterPaid(promoterId).then((promoterInfo) => {
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
  if (!userId) {
    return Promise.resolve(undefined)
  }
  var user = AV.Object.createWithoutData('_User', userId)
  var query = new AV.Query('Promoter')
  query.equalTo('user', user)
  return query.first().then((promoterInfo) => {
    if (promoterInfo) {
      return promoterInfo
    } else {
      throw new Error('can not find promoter info by this user.')
    }
  })
}

/**
 * 根据推广员id获取推广员详情
 * @param promoterId
 * @param includeUser   是否要关联查询用户及上级好友信息
 */
function getPromoterById(promoterId, includeUser) {
  var query = new AV.Query('Promoter')
  if (!includeUser) {
    includeUser = false
  }
  if (includeUser) {
    query.include('user')
    query.include('upUser')
  }
  return query.get(promoterId)
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
  if (level == 13) {    // 到达最高级
    return level
  }
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
    case 5:
      team = globalPromoterCfg.upgradeTable.promoter_level_5.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_5.shop
      break
    case 6:
      team = globalPromoterCfg.upgradeTable.promoter_level_6.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_6.shop
      break
    case 7:
      team = globalPromoterCfg.upgradeTable.promoter_level_7.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_7.shop
      break
    case 8:
      team = globalPromoterCfg.upgradeTable.promoter_level_8.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_8.shop
      break
    case 9:
      team = globalPromoterCfg.upgradeTable.promoter_level_9.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_9.shop
      break
    case 10:
      team = globalPromoterCfg.upgradeTable.promoter_level_10.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_10.shop
      break
    case 11:
      team = globalPromoterCfg.upgradeTable.promoter_level_11.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_11.shop
      break
    case 12:
      team = globalPromoterCfg.upgradeTable.promoter_level_12.team
      shop = globalPromoterCfg.upgradeTable.promoter_level_12.shop
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

/**
 * 保存推广员代理信息
 * @param promoterId
 * @param identity
 * @param province
 * @param city
 * @param district
 * @param street
 */
function saveAgentPromoter(promoterId, identity, province, city, district, street) {
  var promoter = AV.Object.createWithoutData('Promoter', promoterId)
  promoter.set('province', province ? province : '')
  promoter.set('city', city ? city : '')
  promoter.set('district', district ? district : '')
  promoter.set('street', street ? street : '')
  promoter.set('identity', identity)
  return promoter.save()
}

/**
 * 设置代理，如果已经存在同一个地区的省级代理，那么原本的那个代理将被取消
 * @param request
 * @param response
 */
function setPromoterAgent(request, response) {
  var promoterId = request.params.promoterId
  var newIdentity = request.params.identity
  var province = request.params.province ? request.params.province : ''
  var city = request.params.city ? request.params.city : ''
  var district = request.params.district ? request.params.district : ''
  var street = request.params.street ? request.params.street : ''
  var identityQuery = new AV.Query('Promoter')
  identityQuery.equalTo('identity', newIdentity)
  var areaQuery = new AV.Query('Promoter')
  switch (newIdentity) {
    case APPCONST.AGENT_PROVINCE:
      areaQuery.equalTo('province', province)
      break
    case APPCONST.AGENT_CITY:
      areaQuery.equalTo('province', province)
      areaQuery.equalTo('city', city)
      break
    case APPCONST.AGENT_DISTRICT:
      areaQuery.equalTo('province', province)
      areaQuery.equalTo('city', city)
      areaQuery.equalTo('district', district)
      break
    case APPCONST.AGENT_STREET:
      areaQuery.equalTo('province', province)
      areaQuery.equalTo('city', city)
      areaQuery.equalTo('district', district)
      areaQuery.equalTo('street', street)
      break
    default:
      response.success({
        errcode: 0,
        message: '无需设置',
      })
  }

  var query = new AV.Query.and(identityQuery, areaQuery)
  query.first().then((oldAgentPromoter) => {
    if (oldAgentPromoter) {
      saveAgentPromoter(oldAgentPromoter.id, APPCONST.AGENT_NONE).then(() => {
        saveAgentPromoter(promoterId, newIdentity, province, city, district, street).then((newPromoter) => {
          response.success({
            errcode: 0,
            message: '代理设置成功',
            promoter: newPromoter
          })
        }).catch((err) => {
          response.error({
            errcode: 1,
            message: '代理设置失败，请重试',
          })
        })
      }).catch((err) => {
        response.error({
          errcode: 1,
          message: '代理设置失败，请重试',
        })
      })
    } else {
      saveAgentPromoter(promoterId, newIdentity, province, city, district, street).then((newPromoter) => {
        console.log('newPromoter:', newPromoter)
        response.success({
          errcode: 0,
          message: '代理设置成功',
          promoter: newPromoter
        })
      }).catch((err) => {
        response.error({
          errcode: 1,
          message: '代理设置失败，请重试',
        })
      })
    }
  })
}

/**
 * 获取各级代理信息
 * @param request
 * @param response
 */
function fetchPromoterAgent(request, response) {
  var identity = request.params.identity
  var province = request.params.province
  var city = request.params.city
  var district = request.params.district
  var street = request.params.street

  var query = new AV.Query('Promoter')
  if (province) {
    query.equalTo('province', province)
  }
  if (city) {
    query.equalTo('city', city)
  }
  if (district) {
    query.equalTo('district', district)
  }
  if (street) {
    query.equalTo('street', street)
  }

  if (identity == undefined) {
    query.greaterThan('identity', APPCONST.AGENT_NONE)
  } else {
    query.equalTo('identity', identity)
  }

  query.find().then((promoters) => {
    response.success({errcode: 0, promoters: promoters})
  }).catch((err) => {
    response.error({errcode: 1, message: '获取推广员信息失败'})
  })
}

/**
 * 取消某个代理的资格
 * @param request
 * @param response
 */
function cancelPromoterAgent(request, response) {
  var promoterId = request.params.promoterId
  saveAgentPromoter(promoterId, APPCONST.AGENT_NONE).then((promoter) => {
    if (promoter.attributes.identity == APPCONST.AGENT_NONE) {
      response.success({errcode: 0, message: '取消代理资格成功'})
    } else {
      response.error({errcode: 1, message: '取消代理资格失败，请重试'})
    }
  }).catch((err) => {
    response.error({errcode: 2, message: '取消代理资格失败，请重试'})
  })
}

/**
 * 查询推广员信息，支持分页
 * @param request
 * @param response
 */
function fetchPromoter(request, response) {
  var limit = request.params.limit ? request.params.limit : 10    // 默认只返回10条数据
  var skipNum = request.params.skipNum || 0
  var identity = request.params.identity
  var province = request.params.province
  var city = request.params.city
  var district = request.params.district
  var street = request.params.street
  var liveProvince = request.params.liveProvince
  var liveCity = request.params.liveCity
  var liveDistrict = request.params.liveDistrict
  var phone = request.params.phone
  var payment = request.params.payment
  var level = request.params.level
  var minShopEarnings = request.params.minShopEarnings
  var maxShopEarnings = request.params.maxShopEarnings
  var minInviteShopNum = request.params.minInviteShopNum
  var maxInviteShopNum = request.params.maxInviteShopNum
  var minRoyaltyEarnings = request.params.minRoyaltyEarnings
  var maxRoyaltyEarnings = request.params.maxRoyaltyEarnings
  var minTeamMemNum = request.params.minTeamMemNum
  var maxTeamMemNum = request.params.maxTeamMemNum
  var orderRule = request.params.orderRule
  var descend = true

  if (!request.params.descend) {
    descend = true
  } else {
    if ('descend' == request.params.descend) {
      descend = true
    } else {
      descend = false
    }
  }

  var normalQuery = new AV.Query('Promoter')
  if (province) {
    normalQuery.equalTo('province', province)
  }
  if (city) {
    normalQuery.equalTo('city', city)
  }
  if (district) {
    normalQuery.equalTo('district', district)
  }
  if (street) {
    normalQuery.equalTo('street', street)
  }
  if (identity != undefined) {
    normalQuery.equalTo('identity', identity)
  }
  if (liveProvince) {
    normalQuery.equalTo('liveProvince', liveProvince)
  }
  if (liveCity) {
    normalQuery.equalTo('liveCity', liveCity)
  }
  if (liveDistrict) {
    normalQuery.equalTo('liveDistrict', liveDistrict)
  }
  if (phone) {
    normalQuery.equalTo('phone', phone)
  }
  if (payment != undefined) {
    normalQuery.equalTo('payment', payment)
  }
  if (level != undefined) {
    normalQuery.equalTo('level', level)
  }

  var startShopEarningsQuery = new AV.Query('Promoter')
  var endShopEarningsQuery = new AV.Query('Promoter')
  if (minShopEarnings) {
    startShopEarningsQuery.greaterThanOrEqualTo('shopEarnings', minShopEarnings)
  }
  if (maxShopEarnings) {
    endShopEarningsQuery.lessThanOrEqualTo('shopEarnings', maxShopEarnings)
  }
  var startInviteShopQuery = new AV.Query('Promoter')
  var endInviteShopQuery = new AV.Query('Promoter')
  if (minInviteShopNum) {
    startInviteShopQuery.greaterThanOrEqualTo('inviteShopNum', minInviteShopNum)
  }
  if (maxInviteShopNum) {
    endInviteShopQuery.lessThanOrEqualTo('inviteShopNum', maxInviteShopNum)
  }
  var startRoyaltyEarningsQuery = new AV.Query('Promoter')
  var endRoyaltyEarningsQuery = new AV.Query('Promoter')
  if (minRoyaltyEarnings) {
    startRoyaltyEarningsQuery.greaterThanOrEqualTo('royaltyEarnings', minRoyaltyEarnings)
  }
  if (maxRoyaltyEarnings) {
    endRoyaltyEarningsQuery.lessThanOrEqualTo('royaltyEarnings', maxRoyaltyEarnings)
  }
  var startTeamMemNumQuery = new AV.Query('Promoter')
  var endTeamMemNumQuery = new AV.Query('Promoter')
  if (minTeamMemNum) {
    startTeamMemNumQuery.greaterThanOrEqualTo('teamMemNum', minTeamMemNum)
  }
  if (maxTeamMemNum) {
    endTeamMemNumQuery.lessThanOrEqualTo('teamMemNum', maxTeamMemNum)
  }

  var query = AV.Query.and(
    normalQuery,
    startShopEarningsQuery,
    endShopEarningsQuery,
    startInviteShopQuery,
    endInviteShopQuery,
    startRoyaltyEarningsQuery,
    endRoyaltyEarningsQuery,
    startTeamMemNumQuery,
    endTeamMemNumQuery
  )
  query.limit(limit)
  query.skip(skipNum)
  query.include('user')
  if (!orderRule) {
    if (descend) {
      query.addDescending('royaltyEarnings')
      query.addDescending('shopEarnings')
    } else {
      query.addAscending('royaltyEarnings')
      query.addAscending('shopEarnings')
    }
  } else {
    if (descend) {
      if (orderRule == 'royaltyOrder') {
        query.descending('royaltyEarnings')
      } else if (orderRule == 'shopEarnOrder') {
        query.descending('shopEarnings')
      } else if (orderRule == 'inviteShopOrder') {
        query.descending('inviteShopNum')
      } else if (orderRule == 'teamNumOrder') {
        query.descending('teamMemNum')
      } else {
        query.addDescending('royaltyEarnings')
        query.addDescending('shopEarnings')
      }
    } else {
      if (orderRule == 'royaltyOrder') {
        query.ascending('royaltyEarnings')
      } else if (orderRule == 'shopEarnOrder') {
        query.ascending('shopEarnings')
      } else if (orderRule == 'inviteShopOrder') {
        query.ascending('inviteShopNum')
      } else if (orderRule == 'teamNumOrder') {
        query.ascending('teamMemNum')
      } else {
        query.addAscending('royaltyEarnings')
        query.addAscending('shopEarnings')
      }
    }
  }

  var constructUserInfo = require('../Auth').constructUserInfo

  query.find().then((promoters) => {
    var users = []
    promoters.forEach((promoter) => {
      users.push(constructUserInfo(promoter.attributes.user))
    })
    response.success({errcode: 0, promoters: promoters, users: users})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取推广员信息失败'})
  })
}

/**
 * 根据地区获取非代理推广员列表
 * @param request
 * @param response
 */
function fetchNonAgentPromoter(request, response) {
  var limit = request.params.limit ? request.params.limit : 10    // 默认只返回10条数据
  var liveProvince = request.params.liveProvince
  var liveCity = request.params.liveCity
  var liveDistrict = request.params.liveDistrict
  var maxShopEarnings = request.params.maxShopEarnings
  var maxRoyaltyEarnings = request.params.maxRoyaltyEarnings
  var lastTime = request.params.lastTime

  var normalQuery = new AV.Query('Promoter')
  normalQuery.equalTo('identity', 0)
  normalQuery.equalTo('payment', 1)
  if (liveProvince) {
    normalQuery.equalTo('liveProvince', liveProvince)
  }
  if (liveCity) {
    normalQuery.equalTo('liveCity', liveCity)
  }
  if (liveDistrict) {
    normalQuery.equalTo('liveDistrict', liveDistrict)
  }

  var endShopEarningsQuery = new AV.Query('Promoter')
  if (maxShopEarnings) {
    endShopEarningsQuery.lessThanOrEqualTo('shopEarnings', maxShopEarnings)
  }
  var endRoyaltyEarningsQuery = new AV.Query('Promoter')
  if (maxRoyaltyEarnings) {
    endRoyaltyEarningsQuery.lessThanOrEqualTo('royaltyEarnings', maxRoyaltyEarnings)
  }

  var query = AV.Query.and(
    normalQuery,
    endShopEarningsQuery,
    endRoyaltyEarningsQuery
  )
  query.limit(limit)
  query.include('user')
  query.addDescending('createdAt')
  query.addDescending('royaltyEarnings')
  query.addDescending('shopEarnings')
  if (lastTime) {
    query.lessThan('createdAt', new Date(lastTime))
  }

  var constructUserInfo = require('../Auth').constructUserInfo

  query.find().then((promoters) => {
    var users = []
    promoters.forEach((promoter) => {
      users.push(constructUserInfo(promoter.attributes.user))
    })
    response.success({errcode: 0, promoters: promoters, users: users})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取推广员信息失败'})
  })
}

/**
 * 根据推广员id获取推广员详情
 * @param request
 * @param response
 */
function fetchPromoterDetail(request, response) {
  var promoterId = request.params.promoterId

  var query = new AV.Query('Promoter')
  query.include('user')
  query.include('upUser')
  query.get(promoterId).then((promoter) => {
    var constructUserInfo = require('../Auth').constructUserInfo
    response.success({
      errcode: 0,
      promoter: promoter,
      user: constructUserInfo(promoter.attributes.user),
      upUser: constructUserInfo(promoter.attributes.upUser)
    })
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取推广员详情失败'})
  })
}

/**
 * 推广员直通车，直接将普通用户设置为推广员。此方法专为后台使用，
 * 当系统处于初始状态，一个推广员都没有时使用
 * @param request
 * @param response
 */
function directSetPromoter(request, response) {
  var userId = request.params.userId
  var liveProvince = request.params.liveProvince
  var liveCity = request.params.liveCity
  var liveDistrict = request.params.liveDistrict
  var phone = request.params.phone
  var identity = request.params.identity
  var province = request.params.province || ''
  var city = request.params.city || ''
  var district = request.params.district || ''
  var street = request.params.street || ''

  var Promoter = AV.Object.extend('Promoter')
  var promoter = new Promoter()
  var user = AV.Object.createWithoutData('_User', userId)

  if (identity == undefined) {
    identity = APPCONST.AGENT_NONE
  }

  getPromoterByUserId(userId).then((promoter) => {
    response.error({errcode: 1, message: '此用户已经是推广员，不需要再次设置'})
  }).catch((err) => {
    user.addUnique('identity', IDENTITY_PROMOTER)
    user.save().then(() => {
      promoter.set('phone', phone)
      promoter.set('user', user)
      promoter.set('liveProvince', liveProvince)
      promoter.set('liveCity', liveCity)
      promoter.set('liveDistrict', liveDistrict)
      promoter.set('payment', 1)
      promoter.set('shopEarnings', 0)
      promoter.set('royaltyEarnings', 0)
      promoter.set('inviteShopNum', 0)
      promoter.set('teamMemNum', 0)
      promoter.set('level', 1)
      promoter.set('identity', identity)
      if (identity > APPCONST.AGENT_NONE) {
        promoter.set('province', province)
        promoter.set('city', city)
        promoter.set('district', district)
        promoter.set('street', street)
      }

      var newPromoter = undefined

      promoter.save().then((promoterInfo) => {
        newPromoter = promoterInfo
        return insertPromoterInMysql(promoterInfo.id)
      }).then(() => {
        response.success({errcode: 0, promoter: newPromoter})
      }).catch((err) => {
        console.log(err)
        response.error({errcode: 1, message: '保存推广员信息失败'})
      })
    }).catch((err) => {
      console.log(err)
      response.error({errcode: 1, message: '更新用户信息失败'})
    })
  })
}

/**
 * 根据推广员获取推广员所在地区的所有代理列表
 * @param promoter
 */
function getLocalAgents(promoter) {
  var liveProvince = promoter.attributes.liveProvince
  var liveCity = promoter.attributes.liveCity
  var liveDistrict = promoter.attributes.liveDistrict

  var provinceQuery = new AV.Query('Promoter')
  provinceQuery.equalTo('province', liveProvince)
  provinceQuery.equalTo('identity', 1)
  var provinceAgent = provinceQuery.first()

  var cityQuery = new AV.Query('Promoter')
  cityQuery.equalTo('province', liveProvince)
  cityQuery.equalTo('city', liveCity)
  cityQuery.equalTo('identity', 2)
  var cityAgent = cityQuery.first()

  var districtQuery = new AV.Query('Promoter')
  districtQuery.equalTo('province', liveProvince)
  districtQuery.equalTo('city', liveCity)
  districtQuery.equalTo('district', liveDistrict)
  districtQuery.equalTo('identity', 3)
  var districtAgent = districtQuery.first()

  return Promise.all([provinceAgent, cityAgent, districtAgent])
}

/**
 * 获取推广员所在地区的省级代理
 * @param promoter
 * @returns {*}
 */
function getProvinceAgent(promoter) {
  var liveProvince = promoter.attributes.liveProvince

  var provinceQuery = new AV.Query('Promoter')
  provinceQuery.equalTo('province', liveProvince)
  provinceQuery.equalTo('identity', 1)
  return provinceQuery.first()
}

/**
 * 获取推广员所在地区的市级代理
 * @param promoter
 * @returns {*}
 */
function getCityAgent(promoter) {
  var liveProvince = promoter.attributes.liveProvince
  var liveCity = promoter.attributes.liveCity

  var cityQuery = new AV.Query('Promoter')
  cityQuery.equalTo('province', liveProvince)
  cityQuery.equalTo('city', liveCity)
  cityQuery.equalTo('identity', 2)
  return cityQuery.first()
}

/**
 * 获取推广员所在地区的区县级代理
 * @param promoter
 * @returns {*}
 */
function getDistrictAgent(promoter) {
  var liveProvince = promoter.attributes.liveProvince
  var liveCity = promoter.attributes.liveCity
  var liveDistrict = promoter.attributes.liveDistrict

  var districtQuery = new AV.Query('Promoter')
  districtQuery.equalTo('province', liveProvince)
  districtQuery.equalTo('city', liveCity)
  districtQuery.equalTo('district', liveDistrict)
  districtQuery.equalTo('identity', 3)
  return districtQuery.first()
}

/**
 * 获取推广员收益分成比例
 * @param level
 * @returns {Array}
 */
function getPromoterRoyalty(level) {
  var royalty = []
  switch (level) {
    case 1:
      royalty = globalPromoterCfg.upgradeTable.promoter_level_1.royalty
      break
    case 2:
      royalty = globalPromoterCfg.upgradeTable.promoter_level_2.royalty
      break
    case 3:
      royalty = globalPromoterCfg.upgradeTable.promoter_level_3.royalty
      break
    case 4:
      royalty = globalPromoterCfg.upgradeTable.promoter_level_4.royalty
      break
    case 5:
      royalty = globalPromoterCfg.upgradeTable.promoter_level_5.royalty
      break
  }
  return royalty
}

/**
 * 获取代理分成收益
 * @param identity
 * @param income
 * @returns {number}
 */
function getAgentEarning(identity, income) {
  var provinceEarning = globalPromoterCfg.agentTable.province_agent * income
  var cityEarning = globalPromoterCfg.agentTable.city_agent * income
  var districtEarning = globalPromoterCfg.agentTable.district_agent * income
  var streetEarning = globalPromoterCfg.agentTable * income

  var agentEarn = 0

  switch (identity) {
    case APPCONST.AGENT_PROVINCE:
      agentEarn = provinceEarning.toFixed(2)
      break
    case APPCONST.AGENT_CITY:
      agentEarn = cityEarning.toFixed(2)
      break
    case APPCONST.AGENT_DISTRICT:
      agentEarn = districtEarning.toFixed(2)
      break
    case APPCONST.AGENT_STREET:
      agentEarn = streetEarning.toFixed(2)
      break
  }
  return agentEarn
}

/**
 * 计算推广员邀请店铺的收益
 * @param promoter 一级推广员
 * @param shop 被邀请的店铺信息
 * @param income 店铺上交的费用
 * @param charge 用户支付时返回的charge对象
 */
function calPromoterShopEarnings(promoter, shop, income, charge) {
  if (!promoter || !shop) {
    console.log('no promoter, not need to calculate earnings')
    return Promise.resolve()
  }
  var level = promoter.attributes.level
  var mysqlConn = undefined
  var platformEarn = income
  var shopOwner = shop.attributes.owner.id
  var localAgents = []
  var upPro = undefined
  var upUpPro = undefined
  var selfEarn = 0
  var onePromoterEarn = 0
  var twoPromoterEarn = 0
  var updatePaymentBalance = require('../Pingpp').updatePaymentBalance
  var INVITE_SHOP = require('../Pingpp').INVITE_SHOP

  var royalty = getPromoterRoyalty(level)
  if (royalty.length == 0) {
    return new Promise((resolve, reject) => {
      reject(new Error('Promoter level error'))
    })
  }

  console.log('current promoter', promoter.id, ', promoter royalty:', royalty)
  // 第一步先在mysql中插入数据是为了检查mysql中的推广员数据是否存在，如果存在不做任何操作，不存在也插入一条新的记录。这么做为了防止
  // 推广员在注册阶段mysql数据记录没有插入成功导致后面出问题
  return insertPromoterInMysql(promoter.id).then(() => {
    return mysqlUtil.getConnection()
  }).then((conn) => {
    mysqlConn = conn
    return mysqlUtil.beginTransaction(conn)
  }).then(() => {
    // 更新推广员自己的收益
    selfEarn = (income * royalty[0]).toFixed(2)
    platformEarn = (platformEarn - selfEarn).toFixed(2)
    console.log('update promoter balance:', promoter.attributes.user.id, ', earn: ', selfEarn)
    return updatePaymentBalance(mysqlConn, promoter.attributes.user.id, selfEarn).then(() => {
      console.log('update promoter earn:', selfEarn)
      return updatePromoterEarning(mysqlConn, shopOwner, promoter.id, promoter.id, selfEarn, INVITE_SHOP, EARN_SHOP_INVITE, charge)
    })
  }).then((insertRes) => {
    if (!insertRes.results.insertId) {
      throw new Error('Update promoter earning error')
    }
    // 更新一级好友（上级推广员）的分成收益
    var newUpPromoter = undefined
    return getUpPromoter(promoter, false).then((upPromoter) => {
      newUpPromoter = upPromoter
      upPro = upPromoter
      if (upPromoter) {
        console.log('first up promoter:', upPromoter.id)
        onePromoterEarn = (income * royalty[1]).toFixed(2)
        platformEarn = (platformEarn - onePromoterEarn).toFixed(2)
        return insertPromoterInMysql(upPromoter.id).then(() => {
          console.log('update first up promoter balance:', upPromoter.attributes.user.id, ', earn:', onePromoterEarn)
          return updatePaymentBalance(mysqlConn, upPromoter.attributes.user.id, onePromoterEarn)
        }).then(() => {
          console.log('update first up promoter earn:', onePromoterEarn)
          return updatePromoterEarning(mysqlConn, shopOwner, upPromoter.id, promoter.id, onePromoterEarn, INVITE_SHOP, EARN_ROYALTY, charge)
        })
      } else {
        return new Promise((resolve) => {
          resolve()
        })
      }
    }).then((insertRes) => {
      if (insertRes && !insertRes.results.insertId) {
        throw new Error('Update promoter earning of level one friend error')
      }
      return newUpPromoter
    })
  }).then((upPromoter) => {
    // 更新二级好友（上上级推广员）的分成收益
    if (upPromoter) {
      return getUpPromoter(upPromoter, false).then((upupPromoter) => {
        upUpPro = upupPromoter
        if (upupPromoter) {
          console.log('second up promoter:', upupPromoter.id)
          twoPromoterEarn = (income * royalty[2]).toFixed(2)
          platformEarn = (platformEarn - twoPromoterEarn).toFixed(2)
          return insertPromoterInMysql(upupPromoter.id).then(() => {
            console.log('update second up promoter balance:', upupPromoter.attributes.user.id, ', earn:', twoPromoterEarn)
            return updatePaymentBalance(mysqlConn, upupPromoter.attributes.user.id, twoPromoterEarn)
          }).then(() => {
            console.log('update second up promoter earn:', twoPromoterEarn)
            return updatePromoterEarning(mysqlConn, shopOwner, upupPromoter.id, promoter.id, twoPromoterEarn, INVITE_SHOP, EARN_ROYALTY, charge)
          })
        } else {
          return new Promise((resolve) => {
            resolve()
          })
        }
      })
    }
  }).then((insertRes) => {
    if (insertRes && !insertRes.results.insertId) {
      throw new Error('Update promoter earning of level two friend error')
    }
  }).then(() => {
    console.log('update platform earn:', platformEarn, ', promoter:', promoter.id)
    // 更新平台分成收益
    return updatePlatformEarning(mysqlConn, shopOwner, promoter.id, platformEarn, INVITE_SHOP)
  }).then((insertRes) => {
    if (!insertRes.results.insertId) {
      throw new Error('Update platform earnings error')
    }
    console.log('update leancloud data')

    // 更新leancloud上的数据
    var leanAction = []
    console.log('update leancloud self earnings: promoterId= ', promoter.id, ', earn = ', selfEarn)
    var selfAction = updateLeanPromoterEarning(promoter.id, selfEarn, EARN_SHOP_INVITE)
    leanAction.push(selfAction)
    if (upPro) {
      console.log('update leancloud one level promoter earnings: promoterId= ', upPro.id, ', earn = ', onePromoterEarn)
      var onePromoter = updateLeanPromoterEarning(upPro.id, onePromoterEarn, EARN_ROYALTY)
      leanAction.push(onePromoter)
    }
    if (upUpPro) {
      console.log('update leancloud two level promoter earnings: promoterId= ', upUpPro.id, ', earn = ', twoPromoterEarn)
      var twoPromoter = updateLeanPromoterEarning(upUpPro.id, twoPromoterEarn, EARN_ROYALTY)
      leanAction.push(twoPromoter)
    }
    return Promise.all(leanAction)
  }).then(() => {
    return mysqlUtil.commit(mysqlConn)
  }).catch((err) => {
    console.log(err)
    if (mysqlConn) {
      console.log('transaction rollback')
      mysqlUtil.rollback(mysqlConn)
    }
    throw err
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
  })
}

/**
 * 计算推广员邀请新的推广员的收益
 * @param promoter 一级推广员
 * @param invitedPromoter 被邀请的推广员
 * @param income 新推广员上交的费用
 * @param charge 用户
 * @deprecated    已作废，不再使用
 */
function calPromoterInviterEarnings(promoter, invitedPromoter, income, charge) {
  var royalty = globalPromoterCfg.invitePromoterRoyalty[0]
  var royaltyEarnings = (royalty * income).toFixed(2)
  var updatePaymentBalance = require('../Pingpp').updatePaymentBalance
  var INVITE_PROMOTER = require('../Pingpp').INVITE_PROMOTER
  var upPro = undefined
  var upUpPro = undefined
  var onePromoterEarn = (globalPromoterCfg.invitePromoterRoyalty[1] * income).toFixed(2)
  var twoPromoterEarn = (globalPromoterCfg.invitePromoterRoyalty[2] * income).toFixed(2)
  var platformEarn = income

  var mysqlConn = undefined

  // 第一步先在mysql中插入数据是为了检查mysql中的推广员数据是否存在，如果存在不做任何操作，不存在也插入一条新的记录。这么做为了防止
  // 推广员在注册阶段mysql数据记录没有插入成功导致后面出问题
  return insertPromoterInMysql(promoter.id).then(() => {
    return mysqlUtil.getConnection()
  }).then((conn) => {
    mysqlConn = conn
    return mysqlUtil.beginTransaction(conn)
  }).then((conn) => {
    platformEarn = (platformEarn - royaltyEarnings).toFixed(2)
    console.log('update user balance: userId = ', promoter.attributes.user.id, ', earn = ', royaltyEarnings)
    return updatePaymentBalance(conn, promoter.attributes.user.id, royaltyEarnings).then(() => {
      console.log('update promoter earning: invitedPromoter = ', invitedPromoter.id, ', toPromoter = ', promoter.id, ', promoter = ', promoter.id, ', earn = ', royaltyEarnings)
      return updatePromoterEarning(conn, invitedPromoter.id, promoter.id, promoter.id, royaltyEarnings, INVITE_PROMOTER, EARN_ROYALTY, charge)
    })
  }).then((insertRes) => {
    if (!insertRes.results.insertId) {
      throw new Error('Insert new record for DealRecords error')
    }
    // 更新一级好友（上级推广员）的分成收益
    var newUpPromoter = undefined
    return getUpPromoter(promoter, false).then((upPromoter) => {
      newUpPromoter = upPromoter
      upPro = upPromoter
      if (upPromoter) {
        platformEarn = (platformEarn - onePromoterEarn).toFixed(2)
        console.log('update user balance: userId = ', upPromoter.attributes.user.id, ', earn = ', onePromoterEarn)
        return updatePaymentBalance(mysqlConn, upPromoter.attributes.user.id, onePromoterEarn).then(() => {
          console.log('update first up promoter earning: ', onePromoterEarn)
          return updatePromoterEarning(mysqlConn, invitedPromoter.id, upPromoter.id, promoter.id, onePromoterEarn, INVITE_PROMOTER, EARN_ROYALTY, charge)
        })
      } else {
        return new Promise((resolve) => {
          resolve()
        })
      }
    }).then((insertRes) => {
      if (insertRes && !insertRes.results.insertId) {
        throw new Error('Update promoter earning of level one friend error')
      }
      return newUpPromoter
    })
  }).then(() => {
    console.log('update platform earning:', platformEarn)
    return updatePlatformEarning(mysqlConn, invitedPromoter.id, promoter.id, platformEarn, INVITE_PROMOTER)
  }).then((insertRes) => {
    if (!insertRes.results.insertId) {
      throw new Error('Insert new record for PlatformEarnings error')
    }
    var leanAction = []
    console.log('update leancloud self earnings: promoterId= ', promoter.id, ', earn = ', royaltyEarnings)
    var selfAction = updateLeanPromoterEarning(promoter.id, royaltyEarnings, EARN_ROYALTY)
    leanAction.push(selfAction)
    if (upPro) {
      console.log('update leancloud one level promoter earnings: promoterId= ', upPro.id, ', earn = ', onePromoterEarn)
      var onePromoter = updateLeanPromoterEarning(upPro.id, onePromoterEarn, EARN_ROYALTY)
      leanAction.push(onePromoter)
    }
    return Promise.all(leanAction)
  }).then(() => {
    return mysqlUtil.commit(mysqlConn)
  }).catch((err) => {
    if (mysqlConn) {
      console.log('transaction rollback')
      mysqlUtil.rollback(mysqlConn)
    }
    throw err
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
  })
}

/**
 * 更新leancloud中的收益数据
 * @param promoterId
 * @param earn
 * @param earn_type
 * @returns {Promise.<Conversation>|Promise<Conversation>|*}
 */
function updateLeanPromoterEarning(promoterId, earn, earn_type) {
  var numEarn = Number(earn)
  if (0 == numEarn || !promoterId) {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
  var newPromoter = AV.Object.createWithoutData('Promoter', promoterId)
  if (earn_type == EARN_ROYALTY) {
    newPromoter.increment('royaltyEarnings', numEarn)
  } else {
    newPromoter.increment('shopEarnings', numEarn)
  }
  return newPromoter.save(null, {fetchWhenSave: true})
}

/**
 * 更新推广员的收益记录
 * @param conn
 * @param fromId          出钱方的id，可能是推广员的id或者店主id
 * @param toPromoterId    收益方的推广员id
 * @param promoterId      记录此交易的推广员id
 * @param earn
 * @param deal_type 交易类型，直接或者间接的提成收益或者直接邀请店铺获得的收益（INVITE_SHOP ／ INVITE_PROMOTER）
 * @param earn_type 收益类型，邀请店铺或者邀请推广员(EARN_ROYALTY / EARN_SHOP_INVITE)
 * @param charge    用户支付时ping++返回的对象
 * @returns {*|Promise.<TResult>}
 */
function updatePromoterEarning(conn, fromId, toPromoterId, promoterId, earn, deal_type, earn_type, charge) {
  var updateUserDealRecords = require('../Pingpp').updateUserDealRecords
  var earnSql = ''
  if (earn_type == EARN_ROYALTY) {
    earnSql = 'UPDATE `PromoterEarnings` SET `royalty_earnings` = `royalty_earnings` + ? WHERE `promoterId` = ?'
  } else {
    earnSql = 'UPDATE `PromoterEarnings` SET `shop_earnings` = `shop_earnings` + ? WHERE `promoterId` = ?'
  }
  return mysqlUtil.query(conn, earnSql, [earn, toPromoterId]).then((updateRes) => {
    if (0 != earn && 0 == updateRes.results.changedRows) {
      throw new Error('Update PromoterEarnings error')
    }
    var deal = {
      from: fromId,
      to: toPromoterId,
      promoterId: promoterId,
      cost: earn,
      deal_type: deal_type,
      charge_id: charge.id,
      order_no: charge.order_no,
      channel: charge.channel,
      transaction_no: charge.transaction_no,
    }
    return updateUserDealRecords(conn, deal)
  })
}

/**
 * 更新平台收益记录
 * @param conn
 * @param from      分成收益的来源，可能是店铺或者推广员的id
 * @param promoter  属于哪个推广员的业务，记录推广员的id
 * @param earn      收益数额
 * @param deal_type 收益类型，邀请店铺或者邀请推广员（INVITE_SHOP ／ INVITE_PROMOTER）
 */
function updatePlatformEarning(conn, from, promoter, earn, deal_type) {
  var platformSql = 'INSERT INTO `PlatformEarnings` (`from`, `promoter`, `earning`, `deal_type`) VALUES (?, ?, ?, ?)'
  return mysqlUtil.query(conn, platformSql, [from, promoter, earn, deal_type])
}

/**
 * 分配邀请店铺的收益
 * @param request
 * @param response
 */
function distributeInviteShopEarnings(request, response) {
  var income = request.params.income
  var promoterId = request.params.promoterId
  var shopId = request.params.shopId
  var getShopById = require('../Shop').getShopById

  getPromoterById(promoterId).then((promoter) => {
    getShopById(shopId, false).then((shop) => {
      calPromoterShopEarnings(promoter, shop, income, {}).then(() => {
        response.success({errcode: 0, message: '邀请店铺收益分配成功'})
      }).catch((err) => {
        response.error({errcode: 1, message: '邀请店铺收益分配失败'})
      })
    }).catch((err) => {
      console.log(err)
      response.error({errcode: 1, message: '获取邀请的店铺信息失败'})
    })
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 2, message: '获取推广员信息失败'})
  })
}

/**
 * 分配邀请推广员的收益
 * @param request
 * @param response
 */
function distributeInvitePromoterEarnings(request, response) {
  var income = request.params.income
  var promoterId = request.params.promoterId
  var invitedPromoterId = request.params.invitedPromoterId

  getPromoterById(promoterId).then((promoter) => {
    getPromoterById(invitedPromoterId).then((invitedPromoter) => {
      calPromoterInviterEarnings(promoter, invitedPromoter, income, {}).then(() => {
        response.success({errcode: 0, message: '邀请推广员收益分配成功'})
      }).catch((err) => {
        console.log(err)
        response.error({errcode: 1, message: '邀请推广员收益分配失败'})
      })
    }).catch((err) => {
      console.log(err)
      response.error({errcode: 1, message: '获取被邀请的推广员信息失败'})
    })
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取邀请的店铺信息失败'})
  })
}

/**
 * 根据登录用户获取其团队成员
 * @param request
 * @param response
 */
function fetchPromoterTeam(request, response) {
  var currentUser = request.currentUser
  var limit = request.params.limit
  var lastUpdatedAt = request.params.lastUpdatedAt

  if (!limit) {
    limit = 10
  }

  var query = new AV.Query('Promoter')
  query.include('user')
  query.equalTo('upUser', currentUser)
  query.descending('updatedAt')
  query.limit(limit)
  if (lastUpdatedAt) {
    query.lessThan('updatedAt', new Date(lastUpdatedAt))
  }
  query.find().then((promoters) => {
    var constructUserInfo = require('../Auth').constructUserInfo
    var users = []
    promoters.forEach((promoter) => {
      users.push(constructUserInfo(promoter.attributes.user))
    })
    response.success({errcode: 0, promoters: promoters, users: users})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取团队成员失败'})
  })
}

/**
 * 根据推广员id获取其团队成员
 * @param request
 * @param response
 */
function fetchPromoterTeamById(request, response) {
  var promoterId = request.params.promoterId
  var limit = request.params.limit
  var lastUpdatedAt = request.params.lastUpdatedAt

  if (!limit) {
    limit = 10
  }

  getPromoterById(promoterId, true).then((promoter) => {
    var user = promoter.attributes.user

    var query = new AV.Query('Promoter')
    query.include('user')
    query.equalTo('upUser', user)
    query.descending('updatedAt')
    query.limit(limit)
    if (lastUpdatedAt) {
      query.lessThan('updatedAt', new Date(lastUpdatedAt))
    }
    return query.find()
  }).then((promoters) => {
    var constructUserInfo = require('../Auth').constructUserInfo
    var users = []
    promoters.forEach((promoter) => {
      users.push(constructUserInfo(promoter.attributes.user))
    })
    response.success({errcode: 0, promoters: promoters, users: users})
  }).catch((err) => {
    response.error({errcode: 1, message: '获取团队成员失败'})
  })
}

/**
 * 根据登录用户获取其推广的店铺
 * @param request
 * @param response
 */
function fetchPromoterShop(request, response) {
  var currentUser = request.currentUser
  var limit = request.params.limit
  var lastCreatedAt = request.params.lastCreatedAt
  var constructShopInfo = require('../Shop').constructShopInfo

  if (!limit) {
    limit = 10
  }

  var query = new AV.Query('Shop')
  query.equalTo('inviter', currentUser)
  query.descending('createdAt')
  query.include(['targetShopCategory', 'owner', 'containedTag', 'containedPromotions'])
  query.limit(limit)
  if (lastCreatedAt) {
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }
  query.find().then((shops) => {
    var retShops = []
    shops.forEach((shop) => {
      retShops.push(constructShopInfo(shop))
    })
    response.success({errcode: 0, shops: retShops})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取团队成员失败'})
  })
}

/**
 * 根据推广员id获取其推广的店铺
 * @param request
 * @param response
 */
function fetchPromoterShopById(request, response) {
  var promoterId = request.params.promoterId
  var limit = request.params.limit
  var lastCreatedAt = request.params.lastCreatedAt
  var constructShopInfo = require('../Shop').constructShopInfo

  if (!limit) {
    limit = 10
  }

  getPromoterById(promoterId, true).then((promoter) => {
    var user = promoter.attributes.user
    var query = new AV.Query('Shop')
    query.equalTo('inviter', user)
    query.descending('createdAt')
    query.include(['targetShopCategory', 'owner', 'containedTag', 'containedPromotions'])
    query.limit(limit)
    if (lastCreatedAt) {
      query.lessThan('createdAt', new Date(lastCreatedAt))
    }
    return query.find()
  }).then((shops) => {
    var retShops = []
    shops.forEach((shop) => {
      retShops.push(constructShopInfo(shop))
    })
    response.success({errcode: 0, shops: retShops})
  }).catch((err) => {
    response.error({errcode: 1, message: '获取团队成员失败'})
  })
}

/**
 * 获取推广员入驻费
 * @param request
 * @param response
 */
function getPromoterTenant(request, response) {
  response.success({tenant: globalPromoterCfg.promoterCharge})
}

/**
 * 根据地区获取对应的统计数据
 * @param request
 * @param response
 */
function getTotalPerformanceStat(request, response) {
  var province = request.params.province
  var city = request.params.city
  var district = request.params.district

  var query = new AV.Query('Promoter')
  if (province) {
    query.equalTo('liveProvince', province)
  }
  if (city) {
    query.equalTo('liveCity', city)
  }
  if (district) {
    query.equalTo('liveDistrict', district)
  }
  query.find().then((promoters) => {
    var totalInvitedShops = 0
    var totalTeamMems = 0
    var totalPerformance = 0
    var totalPromoters = 0
    promoters.forEach((promoter) => {
      totalInvitedShops += promoter.attributes.inviteShopNum
      totalTeamMems += promoter.attributes.teamMemNum
      totalPerformance += promoter.attributes.shopEarnings + promoter.attributes.royaltyEarnings
      totalPromoters += 1       // 生活在这个区域内的推广员都算作团队成员
    })
    response.success({
      errcode: 0,
      totalInvitedShops,
      totalTeamMems,
      totalPerformance,
      totalPromoters,
    })
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取统计信息失败'})
  })
}

/**
 * 获取区域代理的信息，包括代理的地区，地区的入驻费，代理人信息
 * @param request
 * @param response
 */
function getAreaAgentManagers(request, response) {
  var identity = request.params.identity
  var province = request.params.province
  var city = request.params.city
  var shopTenantByCity = require('./TenantFee').shopTenantByCity
  var getSubAreaByAreaName = require('../baidu').getSubAreaByAreaName
  var constructUserInfo = require('../Auth').constructUserInfo

  var subAreas = []
  var subTenant = undefined
  var areaType = undefined
  var areaName = undefined

  var query = new AV.Query('Promoter')

  if (identity == APPCONST.AGENT_PROVINCE) {
    areaType = 'province'
    areaName = province
  } else if (identity == APPCONST.AGENT_CITY) {
    areaType = 'city'
    areaName = city
  }

  getSubAreaByAreaName(areaName, areaType).then((subCities) => {
    subCities.forEach((subCity) => {
      subAreas.push(subCity.area_name)
    })
  }).then(() => {
    if (identity == APPCONST.AGENT_PROVINCE) {
      var getTanant = []
      subAreas.forEach((area) => {
        getTanant.push(shopTenantByCity(province, area))
      })
      return Promise.all(getTanant)
    } else if (identity == APPCONST.AGENT_CITY) {
      return shopTenantByCity(province, city)
    }
  }).then((result) => {
    subTenant = result
    if (Array.isArray(result)) {
      query.equalTo('province', province)
      query.containedIn('city', subAreas)
    } else {
      query.equalTo('province', province)
      query.equalTo('city', city)
      query.containedIn('district', subAreas)
    }
    query.equalTo('identity', identity+1)
    query.include('user')
    return query.find()
  }).then((promoters) => {
    var retResult = []
    subAreas.forEach((area, index) => {
      var res = {
        area: area,
        tenant: Array.isArray(subTenant) ? subTenant[index] : subTenant,
      }
      var promoter = promoters.find((subPro) => {
        if (identity == APPCONST.AGENT_PROVINCE) {
          if (subPro.attributes.city == area) {
            return true
          }
          return false
        } else if (identity == APPCONST.AGENT_CITY) {
          if (subPro.attributes.district == area) {
            return true
          }
          return false
        }
      })
      res.promoter = promoter
      res.user = promoter ? constructUserInfo(promoter.attributes.user) : undefined
      retResult.push(res)
    })
    response.success({errcode: 0, areaAgent: retResult})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取区域代理信息失败'})
  })
}

/**
 * 根据推广员的昵称或者手机号查询推广员信息
 * @param request
 * @param response
 */
function fetchPromoterByNameOrId(request, response) {
  var keyword = request.params.keyword
  var constructUserInfo = require('../Auth').constructUserInfo
  var promoters = []
  var users = []

  var nameQuery = new AV.Query('_User')
  nameQuery.equalTo('nickname', keyword)

  var phoneQuery = new AV.Query('_User')
  phoneQuery.equalTo('mobilePhoneNumber', keyword)

  var query = AV.Query.or(nameQuery, phoneQuery)
  query.find().then((userInfos) => {
    var ops = []
    userInfos.forEach((user) => {
      var userInfo = constructUserInfo(user)
      users.push(userInfo)
      ops.push(getPromoterByUserId(userInfo.id))
    })
    return Promise.all(ops)
  }).then((promoterInfos) => {
    var retUsers = []
    promoterInfos.forEach((promoter, index) => {
      if (promoter) {
        promoters.push(promoter)
        retUsers.push(users[index])
      }
    })
    response.success({
      errcode: 0,
      promoters: promoters,
      users: retUsers,
    })
  }).catch((err) => {
    console.log(err)
    response.error({
      errcode: 1,
      message: '查询推广员信息失败',
    })
  })
}

/**
 * 获取推广员收益记录
 * @param request
 * @param response
 */
function fetchEarningRecords(request, response) {
  var promoterId = request.params.promoterId
  var limit = request.params.limit || 10
  var lastTime = request.params.lastTime
  var sql = ''
  var mysqlConn = undefined
  var getShopByUserId = require('../Shop').getShopByUserId
  var constructUserInfo = require('../Auth').constructUserInfo
  var INVITE_PROMOTER = require('../Pingpp').INVITE_PROMOTER
  var INVITE_SHOP = require('../Pingpp').INVITE_SHOP
  var originalRecords = []

  mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    if (lastTime) {
      sql = 'SELECT * FROM `DealRecords` WHERE `to`=? AND `deal_time`<? AND `deal_type` in (?, ?) ORDER BY `deal_time` DESC LIMIT ?'
      return mysqlUtil.query(conn, sql, [promoterId, dateFormat(lastTime, 'isoDateTime'), INVITE_PROMOTER, INVITE_SHOP, limit])
    } else {
      sql = 'SELECT * FROM `DealRecords` WHERE `to`=? AND `deal_type` in (?, ?) ORDER BY `deal_time` DESC LIMIT ?'
      return mysqlUtil.query(conn, sql, [promoterId, INVITE_PROMOTER, INVITE_SHOP, limit])
    }
  }).then((queryRes) => {
    var ops = []
    queryRes.results.forEach((deal) => {
      var record = {
        from: deal.from,
        to: deal.to,
        promoterId: deal.promoterId,
        cost: deal.cost,
        dealTime: deal.deal_time,
        dealType: deal.deal_type,
      }
      if (INVITE_SHOP == deal.deal_type) {
        ops.push(getShopByUserId(deal.from))
      } else if (INVITE_PROMOTER == deal.deal_type) {
        ops.push(getPromoterById(deal.from, true))
      }
      originalRecords.push(record)
    })
    // 提前释放mysql连接
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
    mysqlConn = undefined
    return Promise.all(ops)
  }).then((results) => {
    var dealRecords = []
    results.forEach((retValue, index) => {
      var elem = {}
      if (originalRecords[index].dealType == INVITE_SHOP) {
        elem.shop = retValue
      } else if (originalRecords[index].dealType == INVITE_PROMOTER) {
        elem.promoter = retValue
        elem.user = constructUserInfo(retValue.attributes.user)
      }
      elem.cost = originalRecords[index].cost
      elem.promoterId = originalRecords[index].promoterId
      elem.dealType = originalRecords[index].dealType
      elem.dealTime = originalRecords[index].dealTime

      dealRecords.push(elem)
    })
    response.success({errcode: 0, dealRecords: dealRecords})
  }).catch((err) => {
    console.log(err)
    response.error({errcode: 1, message: '获取收益记录失败'})
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
  })
}



/**
 * 补充用户推广员信息
 * @param request
 * @param response
 */
function supplementPromoterInfo(request, response) {
  var userId = request.params.userId

  var currentUser = AV.Object.createWithoutData('_User', userId)
  var existQuery = new AV.Query('Promoter')

  existQuery.equalTo('user', currentUser)
  existQuery.first().then((result) => {
    if(!result) {
      var Promoter = AV.Object.extend('Promoter')
      var promoter = new Promoter()
      promoter.set('user', currentUser)
      return promoter.save()
    }
    return new Promise((resolve) => {resolve(result)})
  }).then((promoter) => {
    if(promoter) {
      response.success({
        errcode: 0,
        promoter: promoter,
      })
    } else {
      response.error({
        errcode: 1,
        message: '补充用户推广员信息失败',
      })
    }
  }).catch((err) => {
    console.log('syncPromoterInfo', err)
    response.error({
      errcode: 1,
      message: '补充用户推广员信息失败',
    })
  })

}

/**
 * 获取我的推广二维码
 * @param request
 * @param response
 */
function getPromoterQrCode(request, response) {
  var unionid = request.params.unionid

  if(!unionid) {
    response.error({
      errcode: 1,
      message: '参数错误',
    })
  }

  var query = new AV.Query('_User')

  query.equalTo("authData.weixin.openid", unionid)

  query.first().then((user) => {
    if(!user) {
      response.success({
        isSignIn: false
      })
    } else {
      var avatar = user.attributes.avatar

      var existQuery = new AV.Query('Promoter')
      existQuery.equalTo('user', user)
      existQuery.first().then((promoter) => {
        if(promoter) {
          var qrcode = promoter.get('qrcode')
          if(!qrcode) {
            wechat_api.createLimitQRCode(unionid, function (err, result) {

              var ticket = result.ticket
               new Promise(function (resolve, reject) {
                Request({
                  url: wechat_api.showQRCodeURL(ticket),
                  encoding: 'base64'
                }, function(err, res, body) {
                  resolve(body);
                });
              }).then((body) => {
                fs.writeFile('./qrcode.jpeg', body, 'base64', function (err) {
                  if(!err) {

                    Request({
                      url: avatar,
                      encoding: 'base64'
                    }, function (err, res, body) {
                      fs.writeFile('./avatar.png', body, 'base64', function (err) {
                        var background = './public/images/qrcode_template.png'
                        var logo = './public/images/hlyd_logo.png'
                        var qrcode = './qrcode.jpeg'
                        var localAvatar = './avatar.png'
                        composeQrCodeImage(background, qrcode, logo, localAvatar, '汇邻优店').then(() => {
                          wechat_api.uploadMaterial('./myQrCode.png', 'image', function (err, result) {
                            var mediaId = result.media_id

                            fs.readFile('./myQrCode.png', 'base64', function (err, buffer) {
                              var data = {base64: buffer}
                              var file = new AV.File('./myQrCode.png', data)
                              file.save().then(function (file) {
                                //删除生成的临时图片
                                fs.unlink('./myQrCode.png')
                                fs.unlink('./qrcode.jpeg')
                                fs.unlink(localAvatar)

                                var url = file.url()
                                var qrcode = {
                                  mediaId: mediaId,
                                  url: url,
                                }
                                promoter.set('qrcode', qrcode)
                                promoter.save().then(function (promoter) {
                                  response.success({
                                    isSignIn: true,
                                    qrcode: qrcode
                                  })
                                })
                              })
                            })

                          })
                        })
                      })
                    })

                  }

                })
              })
            })
          } else {
            response.success({
              isSignIn: true,
              qrcode: qrcode
            })
          }
        } else {
          response.success({
            isSignIn: false
          })
        }
      })

    }
  }).catch((err) => {
    console.log(err)
    response.error({
      errcode: 1,
      message: '获取我的二维码失败',
    })
  })

}

/**
 *  获取我的推广二维码(gm优化)
 * @param request
 * @param response
 */
function gmCreatePromoterQrCode(request, response) {
  var unionid = request.params.unionid
  var query = new AV.Query('_User')
  var avatar = undefined
  var nickname = undefined
  var userId = undefined
  query.equalTo("authData.weixin.openid", unionid)

  query.first().then((user) => {
    if(!user) {
      throw new Error('找不到该用户')
    }
    avatar = user.attributes.avatar
    nickname = user.attributes.nickname
    userId = user.id
    var promoterQuery = new AV.Query('Promoter')
    promoterQuery.equalTo('user', user)
    return promoterQuery.first()
  }).then((promoter) => {
    if(!promoter) {
      throw new Error('找不到该用户的推广元信息')
    }
    var qrcode = promoter.get('qrcode')
    if(qrcode) {
      response.success({
        isSignIn: true,
        qrcode: qrcode
      })
    } else {
      createPromoterQrCode(userId).then((qrcode) => {
        response.success({
          isSignIn: true,
          qrcode: qrcode
        })
      })
    }
  }).catch((error) => {
    console.log("getPromoterQrCode", error)
    response.error(error)
  })
}

function composeQrCodeImage(background, qrcode, logo, avatar, name) {
  images(background).draw(
    images(qrcode).size(320),
    215, 824    //二维码左上角合成坐标
  ).draw(
    images(80, 80).draw(
      images(logo).size(76), 2, 2
    ),
    335, 944   //汇邻优店左上角合成坐标
  ).draw(
    images(avatar).size(64),
    210, 720    //个人头像合成坐标
  ).save("myQrCode.png", {
    quality: 50
  })

  return new Promise((resolve, reject) => {
    resolve()
  })
}

function createPromoterQrCode(userId) {
  var user = AV.Object.createWithoutData('_User', userId)
  var background = './public/images/qrcode_template.png'
  var logo = './public/images/hlyd_logo.png'
  var unionid = undefined
  var avatar = undefined
  var nickname = undefined
  var mediaId = undefined
  var tmpPromoterQrcodrPath = unionid + 'promoterQrcode.jpeg'

  return user.fetch().then(() => {
    var authData = user.get('authData')
    unionid = authData && authData.weixin.openid
    avatar = user.get('avatar')
    nickname = user.get('nickname')
    console.log("avatar:",  avatar)
    return mpQrcodeFuncs.createLimitQRCode(unionid)
  }).then((qrcodeUrl) => {
    return new Promise(function (resolve, reject) {
      gm(background)
        .font("./public/SansCN-Regular.TTF", 40)
        .fontSize(40)
        .drawText(320, 760, "绿蚁网络")
        .draw('image Over 210, 720 64, 64 "' + avatar + '"')
        .draw('image Over 215, 824 320, 320 "' + qrcodeUrl + '"')
        .draw('image Over 335, 944 80, 80 "' + logo + '"')
        .write(tmpPromoterQrcodrPath, function (err) {
          if(err) {
            console.log("GraphicsMagick error", err)
            reject(err)
          }
          resolve()
        })
    })
  }).then(() => {
    console.log("gm process success")
    return mpMaterialFuncs.uploadMaterial(tmpPromoterQrcodrPath)
  }).then((result) => {
    mediaId = result.mediaId
    return util.readFileAsyn(tmpPromoterQrcodrPath, 'base64')
  }).then((buffer) => {
    var data = {base64: buffer}
    var file = new AV.File('promoterQrcode', data)
    return file.save()
  }).then((file) => {
    var qrcode = {
      url: file.url(),
      mediaId: mediaId
    }
    fs.exists(tmpPromoterQrcodrPath, function (exists) {
      if(exists)
        fs.unlink(tmpPromoterQrcodrPath)
    })
    return qrcode
  }).catch((error) => {
    console.log("createPromoterQrCode failed!", error)
    fs.exists(tmpPromoterQrcodrPath, function (exists) {
      if(exists)
        fs.unlink(tmpPromoterQrcodrPath)
    })
    throw error
  })
}

function promoterTest(request, response) {
  var userId = "59a8fe8044d9040058421bb7"
  createPromoterQrCode(userId).then((result) => {
    console.log("createPromoterQrCode", result)
    response.success(result)
  }).catch((error) => {
    response.error(error)
  })
}

var PromoterFunc = {
  getPromoterConfig: getPromoterConfig,
  fetchPromoterSysConfig: fetchPromoterSysConfig,
  setPromoterSysConfig: setPromoterSysConfig,
  getPromoterInviteCode: getPromoterInviteCode,
  savePromoterInviteCode: savePromoterInviteCode,
  getPromoterByInviteCode: getPromoterByInviteCode,
  promoterCertificate: promoterCertificate,
  getPromoterById: getPromoterById,
  getUpPromoter: getUpPromoter,
  getUpPromoterByUserId: getUpPromoterByUserId,
  promoterPaid: promoterPaid,
  finishPromoterPayment: finishPromoterPayment,
  fetchPromoterByUser: fetchPromoterByUser,
  incrementInviteShopNum: incrementInviteShopNum,
  getPromoterByUserId: getPromoterByUserId,
  setPromoterAgent: setPromoterAgent,
  fetchPromoterAgent: fetchPromoterAgent,
  cancelPromoterAgent: cancelPromoterAgent,
  fetchPromoter: fetchPromoter,
  fetchNonAgentPromoter: fetchNonAgentPromoter,
  fetchPromoterDetail: fetchPromoterDetail,
  directSetPromoter: directSetPromoter,
  calPromoterShopEarnings: calPromoterShopEarnings,
  calPromoterInviterEarnings: calPromoterInviterEarnings,
  distributeInviteShopEarnings: distributeInviteShopEarnings,
  distributeInvitePromoterEarnings: distributeInvitePromoterEarnings,
  fetchPromoterTeam: fetchPromoterTeam,
  fetchPromoterTeamById: fetchPromoterTeamById,
  fetchPromoterShop: fetchPromoterShop,
  fetchPromoterShopById: fetchPromoterShopById,
  getPromoterTenant: getPromoterTenant,
  getTotalPerformanceStat: getTotalPerformanceStat,
  getAreaAgentManagers: getAreaAgentManagers,
  fetchPromoterByNameOrId: fetchPromoterByNameOrId,
  fetchEarningRecords: fetchEarningRecords,
  syncPromoterInfo: syncPromoterInfo,
  supplementPromoterInfo: supplementPromoterInfo,
  getPromoterQrCode: getPromoterQrCode,
  bindPromoterInfo: bindPromoterInfo,
  createPromoterQrCode: createPromoterQrCode,
  promoterTest: promoterTest
}

module.exports = PromoterFunc