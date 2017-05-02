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
var mysqlUtil = require('../util/mysqlUtil')

const PREFIX = 'promoter:'

// 收益来源分类
const INVITE_PROMOTER = 1       // 邀请推广员获得的收益
const INVITE_SHOP = 2           // 邀请店铺获得的收益

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
  invitePromoterRoyalty: 0.2,       // 推广员入驻费提成比例
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

    response.success({
      errcode: 0,
      message: '设置推广参数成功！',
    })
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
        message: '邀请码无效，请向推广员重新获取邀请码',
      })
      return
    }
    var currentUser = request.currentUser
    var phone = request.params.phone
    var liveProvince = request.params.liveProvince
    var liveCity = request.params.liveCity
    var liveDistrict = request.params.liveDistrict
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
  var name = request.params.name
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
  if (name) {
    normalQuery.startsWith('name', name)
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
  var name = request.params.name
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
      promoter.set('name', name)
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
      agentEarn = provinceEarning.toFixed(3)
      break
    case APPCONST.AGENT_CITY:
      agentEarn = cityEarning.toFixed(3)
      break
    case APPCONST.AGENT_DISTRICT:
      agentEarn = districtEarning.toFixed(3)
      break
    case APPCONST.AGENT_STREET:
      agentEarn = streetEarning.toFixed(3)
      break
  }
  return agentEarn
}

/**
 * 计算推广员邀请店铺的收益
 * @param promoter 一级推广员
 * @param shop 被邀请的店铺信息
 * @param income 店铺上交的费用
 */
function calPromoterShopEarnings(promoter, shop, income) {
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
    return getProvinceAgent(promoter)
  }).then((provinceAgent) => {
    if (provinceAgent) {
      localAgents.push(provinceAgent)
      var identity = provinceAgent.attributes.identity
      var agentEarn = getAgentEarning(identity, income)
      console.log('province agent:', provinceAgent.id, ', earn:', agentEarn)
      platformEarn = platformEarn - agentEarn
      return insertPromoterInMysql(provinceAgent.id).then(() => {
        console.log('update province balance:', provinceAgent.attributes.user.id, ', earn:', agentEarn)
        return updatePaymentBalance(mysqlConn, provinceAgent.attributes.user.id, agentEarn)
      }).then(() => {
        console.log('update province agent earn:', agentEarn)
        return updatePromoterEarning(mysqlConn, shopOwner, provinceAgent.id, promoter.id, agentEarn, INVITE_SHOP, EARN_ROYALTY)
      })
    } else {
      return new Promise((resolve) => {
        resolve()
      })
    }
  }).then((insertRes) => {
    if (insertRes && !insertRes.results.insertId) {
      throw new Error('Update province promoter earning error')
    }
    return getCityAgent(promoter)
  }).then((cityAgent) => {
    if (cityAgent) {
      localAgents.push(cityAgent)
      var identity = cityAgent.attributes.identity
      var agentEarn = getAgentEarning(identity, income)
      console.log('city agent:', cityAgent.id, ', earn:', agentEarn)
      platformEarn = platformEarn - agentEarn
      return insertPromoterInMysql(cityAgent.id).then(() => {
        console.log('update city balance:', cityAgent.attributes.user.id, ', earn:', agentEarn)
        return updatePaymentBalance(mysqlConn, cityAgent.attributes.user.id, agentEarn)
      }).then(() => {
        console.log('update city agent earn:', agentEarn)
        return updatePromoterEarning(mysqlConn, shopOwner, cityAgent.id, promoter.id, agentEarn, INVITE_SHOP, EARN_ROYALTY)
      })
    } else {
      return new Promise((resolve) => {
        resolve()
      })
    }
  }).then((insertRes) => {
    if (insertRes && !insertRes.results.insertId) {
      throw new Error('Update city promoter earning error')
    }
    return getDistrictAgent(promoter)
  }).then((districtAgent) => {
    if (districtAgent) {
      localAgents.push(districtAgent)
      var identity = districtAgent.attributes.identity
      var agentEarn = getAgentEarning(identity, income)
      console.log('district agent:', districtAgent.id, ', earn:', agentEarn)
      platformEarn = platformEarn - agentEarn
      return insertPromoterInMysql(districtAgent.id).then(() => {
        console.log('update district balance:', districtAgent.attributes.user.id, ', earn:', agentEarn)
        return updatePaymentBalance(mysqlConn, districtAgent.attributes.user.id, agentEarn)
      }).then(() => {
        console.log('update district agent earn:', agentEarn)
        return updatePromoterEarning(mysqlConn, shopOwner, districtAgent.id, promoter.id, agentEarn, INVITE_SHOP, EARN_ROYALTY)
      })
    } else {
      return new Promise((resolve) => {
        resolve()
      })
    }
  }).then((insertRes) => {
    if (insertRes && !insertRes.results.insertId) {
      throw new Error('Update district promoter earning error')
    }
    // 更新推广员自己的收益
    selfEarn = income * royalty[0]
    platformEarn = platformEarn - selfEarn
    console.log('update promoter balance:', promoter.attributes.user.id, ', earn: ', selfEarn)
    return updatePaymentBalance(mysqlConn, promoter.attributes.user.id, selfEarn).then(() => {
      console.log('update promoter earn:', selfEarn)
      return updatePromoterEarning(mysqlConn, shopOwner, promoter.id, promoter.id, selfEarn, INVITE_SHOP, EARN_SHOP_INVITE)
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
      console.log('first up promoter:', upPromoter.id)
      if (upPromoter) {
        onePromoterEarn = income * royalty[1]
        platformEarn = platformEarn - onePromoterEarn
        return insertPromoterInMysql(upPromoter.id).then(() => {
          console.log('update first up promoter balance:', upPromoter.attributes.user.id, ', earn:', onePromoterEarn)
          return updatePaymentBalance(mysqlConn, upPromoter.attributes.user.id, onePromoterEarn)
        }).then(() => {
          console.log('update first up promoter earn:', onePromoterEarn)
          return updatePromoterEarning(mysqlConn, shopOwner, upPromoter.id, promoter.id, onePromoterEarn, INVITE_SHOP, EARN_ROYALTY)
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
        console.log('second up promoter:', upupPromoter.id)
        if (upupPromoter) {
          twoPromoterEarn = income * royalty[2]
          platformEarn = platformEarn - twoPromoterEarn
          return insertPromoterInMysql(upupPromoter.id).then(() => {
            console.log('update second up promoter balance:', upupPromoter.attributes.user.id, ', earn:', twoPromoterEarn)
            return updatePaymentBalance(mysqlConn, upupPromoter.attributes.user.id, twoPromoterEarn)
          }).then(() => {
            console.log('update second up promoter earn:', twoPromoterEarn)
            return updatePromoterEarning(mysqlConn, shopOwner, upupPromoter.id, promoter.id, twoPromoterEarn, INVITE_SHOP, EARN_ROYALTY)
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
    localAgents.forEach((agent) => {
      var identity = agent.attributes.identity
      var agentEarn = getAgentEarning(identity, income)
      var agentAction = updateLeanPromoterEarning(agent.id, agentEarn, EARN_ROYALTY)
      leanAction.push(agentAction)
    })
    var selfAction = updateLeanPromoterEarning(promoter.id, selfEarn, EARN_SHOP_INVITE)
    var onePromoter = updateLeanPromoterEarning(upPro.id, onePromoterEarn, EARN_ROYALTY)
    var twoPromoter = updateLeanPromoterEarning(upUpPro.id, twoPromoterEarn, EARN_ROYALTY)
    leanAction.push(selfAction, onePromoter, twoPromoter)
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
 */
function calPromoterInviterEarnings(promoter, invitedPromoter, income) {
  var royalty = globalPromoterCfg.invitePromoterRoyalty
  var royaltyEarnings = royalty * income
  var updatePaymentBalance = require('../Pingpp').updatePaymentBalance

  var mysqlConn = undefined

  // 第一步先在mysql中插入数据是为了检查mysql中的推广员数据是否存在，如果存在不做任何操作，不存在也插入一条新的记录。这么做为了防止
  // 推广员在注册阶段mysql数据记录没有插入成功导致后面出问题
  return insertPromoterInMysql(promoter.id).then(() => {
    return mysqlUtil.getConnection()
  }).then((conn) => {
    mysqlConn = conn
    return mysqlUtil.beginTransaction(conn)
  }).then((conn) => {
    return updatePaymentBalance(conn, promoter.attributes.user.id, royaltyEarnings).then(() => {
      return updatePromoterEarning(conn, invitedPromoter.id, promoter.id, promoter.id, royaltyEarnings, INVITE_PROMOTER, EARN_ROYALTY)
    })
  }).then((insertRes) => {
    if (!insertRes.results.insertId) {
      throw new Error('Insert new record for PromoterDeal error')
    }
    return updatePlatformEarning(insertRes.conn, invitedPromoter.id, promoter.id, income-royaltyEarnings, INVITE_PROMOTER)
  }).then((insertRes) => {
    if (!insertRes.results.insertId) {
      throw new Error('Insert new record for PlatformEarnings error')
    }
    return updateLeanPromoterEarning(promoter.id, royaltyEarnings, EARN_ROYALTY)
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
  var newPromoter = AV.Object.createWithoutData('Promoter', promoterId)
  if (earn_type == EARN_ROYALTY) {
    newPromoter.increment('royaltyEarnings', earn)
  } else {
    newPromoter.increment('shopEarnings', earn)
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
 * @returns {*|Promise.<TResult>}
 */
function updatePromoterEarning(conn, fromId, toPromoterId, promoterId, earn, deal_type, earn_type) {
  var earnSql = ''
  if (earn_type == EARN_ROYALTY) {
    earnSql = 'UPDATE `PromoterEarnings` SET `royalty_earnings` = `royalty_earnings` + ? WHERE `promoterId` = ?'
  } else {
    earnSql = 'UPDATE `PromoterEarnings` SET `shop_earnings` = `shop_earnings` + ? WHERE `promoterId` = ?'
  }
  return mysqlUtil.query(conn, earnSql, [earn, toPromoterId]).then((updateRes) => {
    if (0 == updateRes.results.changedRows) {
      throw new Error('Update PromoterEarnings error')
    }
    var recordSql = 'INSERT INTO `PromoterDeal` (`from`, `to`, `cost`, `promoterId`, `deal_type`) VALUES (?, ?, ?, ?, ?)'
    return mysqlUtil.query(conn, recordSql, [fromId, toPromoterId, earn, promoterId, deal_type])
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
      calPromoterShopEarnings(promoter, shop, income).then(() => {
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
      calPromoterInviterEarnings(promoter, invitedPromoter, income).then(() => {
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
    promoters.forEach((promoter) => {
      totalInvitedShops += promoter.attributes.inviteShopNum
      totalTeamMems += promoter.attributes.teamMemNum
      totalPerformance += promoter.attributes.shopEarnings + promoter.attributes.royaltyEarnings
    })
    response.success({
      errcode: 0,
      totalInvitedShops,
      totalTeamMems,
      totalPerformance,
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
  var originalRecords = []

  mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    if (lastTime) {
      sql = 'SELECT * FROM `PromoterDeal` WHERE `to`=? AND `deal_time`<? ORDER BY `deal_time` DESC LIMIT ?'
      return mysqlUtil.query(conn, sql, [promoterId, lastTime, limit])
    } else {
      sql = 'SELECT * FROM `PromoterDeal` WHERE `to`=? ORDER BY `deal_time` DESC LIMIT ?'
      return mysqlUtil.query(conn, sql, [promoterId, limit])
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
}

module.exports = PromoterFunc