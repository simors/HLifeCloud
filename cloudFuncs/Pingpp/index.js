/**
 * Created by wanpeng on 2017/3/27.
 */
var redis = require('redis');
var AV = require('leanengine');
var Crypto = require('crypto');
var GLOBAL_CONFIG = require('../../config')
var pingpp = require('pingpp')(GLOBAL_CONFIG.PINGPP_API_KEY)
var utilFunc = require('../util')
var mysqlUtil = require('../util/mysqlUtil')
var Promise = require('bluebird')
var shopFunc = require('../../cloudFuncs/Shop')
var dateFormat = require('dateformat')


// 收益来源分类
const INVITE_PROMOTER = 1       // 邀请推广员获得的收益
const INVITE_SHOP = 2           // 邀请店铺获得的收益
const BUY_GOODS = 3             // 购买商品
const REWARD = 4                // 打赏
const WITHDRAW = 5              // 取现

// 异常状态
const NOT_FIXED = 1             // 异常未被处理
const FIXED = 2                 // 异常已被处理

// 支付费率
const PREFIX = 'paymentFree:'

/**
 * 更新异常交易记录
 * @param deal
 * @returns {*}
 */
function addExceptionEarnings(deal) {
  var mysqlConn = undefined
  if (!deal.from || !deal.to || !deal.amount || !deal.deal_type) {
    throw new Error('')
  }
  var charge_id = deal.charge_id || ''
  var order_no = deal.order_no || ''
  var channel = deal.channel || ''
  var transaction_no = deal.transaction_no || ''
  var recordSql = 'INSERT INTO `ExceptionEarnings` (`from`, `to`, `amount`, `deal_type`, `charge_id`, `order_no`, `channel`, `transaction_no`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    return mysqlUtil.query(conn, recordSql, [deal.from, deal.to, deal.amount, deal.deal_type, charge_id, order_no, channel, transaction_no, NOT_FIXED])
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
  })
}

/**
 * 更新mysql中PaymentInfo表的余额
 * @param conn
 * @param userId
 * @param earning
 * @returns {Promise.<T>}
 */
function updatePaymentBalance(conn, userId, earning) {
  var sql = ""

  sql = "SELECT count(1) as cnt FROM `PaymentInfo` WHERE `userId` = ? "
  return mysqlUtil.query(conn, sql, [userId]).then((queryRes) => {
    if (queryRes.results[0].cnt == 0) {
      sql = "INSERT INTO `PaymentInfo` (`userId`, `balance`) VALUES (?, ?)"
      return mysqlUtil.query(queryRes.conn, sql, [userId, earning])
    } else if (queryRes.results[0].cnt == 1) {
      sql = "UPDATE `PaymentInfo` SET `balance` = `balance` + ? WHERE `userId` = ?"
      return mysqlUtil.query(queryRes.conn, sql, [earning, userId])
    } else {
      return new Promise((resolve) => {
        resolve()
      })
    }
  }).catch((err) => {
    throw err
  })
}

/**
 * 在mysql中设置支付密码
 * @param userId
 * @param password
 * @returns {Promise.<T>}
 */
function setPaymentPasswordInMysql(userId, password) {
  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PaymentInfo` WHERE `userId` = ? "
    return mysqlUtil.query(conn, sql, [userId])
  }).then((queryRes) => {
    if (queryRes.results[0].cnt == 1) {
      sql = "UPDATE `PaymentInfo` SET `password` = ? WHERE `userId` = ?"
      return mysqlUtil.query(queryRes.conn, sql, [password, userId])
    } else if (queryRes.results[0].cnt == 0) {
      sql = "INSERT INTO `PaymentInfo` (`password`, `userId`) VALUES (?, ?)"
      return mysqlUtil.query(queryRes.conn, sql, [password, userId])
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
 * 在mysql中支付密码校验
 * @param userId
 * @param password
 * @returns {Promise.<T>}
 */
function authPaymentPasswordInMysql(userId, password) {
  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PaymentInfo` WHERE `userId` = ? AND `password` = ?"
    return mysqlUtil.query(conn, sql, [userId, password])
  }).then((queryRes) => {
    if (queryRes.results[0].cnt == 1) {
      return new Promise((resolve, reject) => {
        resolve()
      })
    } else {
      return new Promise((resolve, reject) => {
        reject()
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
 * 在mysql中插入支付记录
 * @param charge
 * @returns {Promise.<T>}
 */
function insertChargeInMysql(charge) {
  var created = new Date(charge.created * 1000).toISOString().slice(0, 19).replace('T', ' ')
  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PaymentCharge` WHERE `order_no` = ? LIMIT 1"
    return mysqlUtil.query(conn, sql, [charge.order_no])
  }).then((queryRes) => {
    if (queryRes.results[0].cnt == 0) {
      sql = "INSERT INTO `PaymentCharge` (`order_no`, `channel`, `created`, `amount`, `currency`, `transaction_no`, `subject`, `user`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      return mysqlUtil.query(queryRes.conn, sql, [charge.order_no, charge.channel, created, charge.amount, charge.currency, charge.transaction_no, charge.subject, charge.metadata.user])
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
 * 在mysql中插入提现记录
 * @param transfer
 * @returns {Promise.<T>}
 */
function insertTransferInMysql(transfer) {
  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `DealRecords` WHERE `order_no` = ? LIMIT 1"
    return mysqlUtil.query(conn, sql, [transfer.order_no])
  }).then((queryRes) => {
    if (queryRes.results[0].cnt == 0) {
      var deal = {
        from: 'platform',
        to: transfer.metadata.userId,
        cost: (transfer.amount * 0.01).toFixed(2),
        deal_type: WITHDRAW,
        charge_id: transfer.id,
        order_no: transfer.order_no,
        channel: transfer.channel,
        transaction_no: transfer.transaction_no
      }
      return updateUserDealRecords(mysqlConn, deal)
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
 * 在mysql中插入支付绑定银行卡信息
 * @param card
 * @returns {Promise.<T>}
 */
function insertCardInMysql(cardInfo) {
  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PaymentInfo` WHERE `userId` = ? LIMIT 1"
    return mysqlUtil.query(conn, sql, [cardInfo.userId])
  }).then((queryRes) => {
    if (queryRes.results[0].cnt == 0) {
      sql = "INSERT INTO `PaymentInfo` (`id_name`, `id_number`, `card_number`, `phone_number`, `userId`) VALUES (?, ?, ?, ?, ?)"
      return mysqlUtil.query(queryRes.conn, sql, [cardInfo.id_name, cardInfo.id_number, cardInfo.card_number, cardInfo.phone_number, cardInfo.userId])
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
 * 更新mysql中的支付信息
 * @param card
 * @returns {Promise.<T>}
 */
function updatePaymentInfoInMysql(paymentInfo) {

  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PaymentInfo` WHERE `userId` = ? LIMIT 1"
    return mysqlUtil.query(conn, sql, [paymentInfo.userId])
  }).then((queryRes) => {
    if (queryRes.results[0].cnt == 1) {
      if(paymentInfo.channel == 'alipay') {
        sql = "UPDATE `PaymentInfo` SET `card_number` = ?, `id_name` = ?, `open_bank_code` = ?, `open_bank` = ?, `balance` = `balance` - ? WHERE `userId` = ?"
        return mysqlUtil.query(queryRes.conn, sql, [paymentInfo.card_number, paymentInfo.user_name, paymentInfo.open_bank_code, paymentInfo.open_bank, paymentInfo.amount, paymentInfo.userId])
      } else if (paymentInfo.channel == 'wx_pub') {
        sql = "UPDATE `PaymentInfo` SET `open_id` = ?, `balance` = `balance` - ? WHERE `userId` = ?"
        return mysqlUtil.query(queryRes.conn, sql, [paymentInfo.openid, paymentInfo.amount, paymentInfo.userId])
      } else {
        return new Promise((resolve) => {
          resolve()
        })
      }
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


function createPayment(request, response) {
  var user = request.params.user
  var subject = request.params.subject
  var order_no = request.params.order_no
  var amount = request.params.amount
  var channel = request.params.channel
  var metadata = request.params.metadata

  var extra = {};
  // var channel = 'alipay'
  // switch (channel) {
  //   case 'alipay':
  //     extra = {}
  //     metadata = {
  //       user: user,
  //     }
  //     break;
  //   case 'wx':
  //     extra = {}
  //     metadata = {
  //       user: user,
  //     }
  //     break
  //   default:
  //     break;
  // }

  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem");
  pingpp.charges.create({
    order_no: order_no,// 推荐使用 8-20 位，要求数字或字母，不允许其他字符
    app: {id: GLOBAL_CONFIG.PINGPP_APP_ID},
    channel: channel,// 支付使用的第三方支付渠道取值，请参考：https://www.pingxx.com/api#api-c-new
    amount: amount,//订单总金额, 人民币单位：分（如订单总金额为 1 元，此处请填 100）
    client_ip: "127.0.0.1",// 发起支付请求客户端的 IP 地址，格式为 IPV4，如: 127.0.0.1
    currency: "cny",
    subject: subject,
    body: "商品的描述信息",
    extra: extra,
    description: "店铺入驻费用",
    metadata: metadata,
  }, function (err, charge) {
    if (err != null) {
      console.log("pingpp.charges.create fail:", err)
      response.error({
        errcode: 1,
        message: '[PingPP] create charges failed!',
      })
    }
    response.success({
      errcode: 0,
      message: '[PingPP] create charges success!',
      charge: charge,
    })
    // YOUR CODE
  })
}

/**
 * 更新交易记录，包括各种收益和取现记录
 * @param conn
 * @param deal
 * @returns {*}
 */
function updateUserDealRecords(conn, deal) {
  if (!deal.from || !deal.to || !deal.cost || !deal.deal_type) {
    throw new Error('')
  }
  var promoterId = deal.promoterId || ''
  var charge_id = deal.charge_id || ''
  var order_no = deal.order_no || ''
  var channel = deal.channel || ''
  var transaction_no = deal.transaction_no || ''
  var recordSql = 'INSERT INTO `DealRecords` (`from`, `to`, `cost`, `promoterId`, `deal_type`, `charge_id`, `order_no`, `channel`, `transaction_no`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  return mysqlUtil.query(conn, recordSql, [deal.from, deal.to, deal.cost, promoterId, deal.deal_type, charge_id, order_no, channel, transaction_no])
}

function paymentEvent(request, response) {
  var charge = request.params.data.object
  var promoterId = charge.metadata.promoterId
  var shopId = charge.metadata.shopId
  var fromUser = charge.metadata.fromUser
  var toUser = charge.metadata.toUser
  var dealType = charge.metadata.dealType
  var amount = charge.amount * 0.01 //单位为 元
  var upPromoterId = undefined
  var shopInviterId = undefined
  var promoterFunc = require('../Promoter')
  var mysqlConn = undefined

  return insertChargeInMysql(charge).then(() => {
    if (promoterId) {
      console.log('invoke promoter paid:', promoterId, ', ', amount)
      var promoter = undefined
      return promoterFunc.getPromoterById(promoterId).then((promoterInfo) => {
        promoter = promoterInfo
        return promoterFunc.getUpPromoter(promoter)
      }).then((upPromoter) => {
        if (!upPromoter) {
          return new Promise((resolve) => {
            resolve()
          })
        }
        upPromoterId = upPromoter.id
        return promoterFunc.calPromoterInviterEarnings(upPromoter, promoter, amount, charge)
      }).then(() => {
        // app端也会发起更改状态的请求，这里再次发起请求为保证数据可靠性
        return promoterFunc.promoterPaid(promoterId)
      })
    } else if (shopId && amount) {
      console.log('invoke shop paid:', shopId, ', ', amount)
      var shop = undefined
      return shopFunc.getShopById(shopId).then((shopInfo) => {
        shop = shopInfo
        var inviter = shop.attributes.inviter.id
        console.log('shop inviter:', inviter)
        shopInviterId = inviter
        return promoterFunc.getPromoterByUserId(inviter)
      }).then((promoter) => {
        return promoterFunc.calPromoterShopEarnings(promoter, shop, amount, charge)
      }).then(() => {
        // app端也会发起更改状态的请求，这里再次发起请求为保证数据可靠性
        return shopFunc.updateShopInfoAfterPaySuccess(shopId, amount)
      })
    } else if (fromUser && toUser) {
      console.log('invoke common paid: ', fromUser, ', ', toUser)
      var deal = {
        from: fromUser,
        to: toUser,
        cost: amount,
        deal_type: dealType,
        charge_id: charge.id,
        order_no: charge.order_no,
        channel: charge.channel,
        transaction_no: charge.transaction_no
      }
      return mysqlUtil.getConnection().then((conn) => {
        mysqlConn = conn
        return mysqlUtil.beginTransaction(conn)
      }).then(() => {
        return updateUserDealRecords(mysqlConn, deal)
      }).then(() => {
        return updatePaymentBalance(mysqlConn, toUser, deal.cost)
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
  }).then(() => {
    response.success({
      errcode: 0,
      message: 'paymentEvent charge into mysql success!',
    })
  }).catch((error) => {
    var exp = {
      amount: amount,
      charge_id: charge.id,
      order_no: charge.order_no,
      channel: charge.channel,
      transaction_no: charge.transaction_no
    }
    if (promoterId) {
      console.log('distribute promoter earnings error: ', error)
      exp.deal_type = INVITE_PROMOTER
      exp.from = promoterId
      exp.to = upPromoterId
      addExceptionEarnings(exp).catch((err) => {
        console.log('save exception earn for promoter error: ', err)
      })
    } else if (shopId && amount) {
      console.log('distribute invite shop earnings error: ', error)
      exp.deal_type = INVITE_SHOP
      exp.from = shopId
      exp.to = shopInviterId
      addExceptionEarnings(exp).catch((err) => {
        console.log('save exception earn for shop error: ', err)
      })
    } else if (fromUser && toUser) {
      console.log('distribute common user payment error: ', error)
      exp.deal_type = dealType
      exp.from = fromUser
      exp.to = toUser
      addExceptionEarnings(exp).catch((err) => {
        console.log('save exception earn for common payment error: ', err)
      })
    }
    response.error({
      errcode: 1,
      message: 'paymentEvent charge into mysql fail!',
    })
  })
}

function createTransfers(request, response) {

  console.log("createTransfers")
  var order_no = request.params.order_no
  var amount = parseInt(request.params.amount).toFixed(0) * 100 //人民币分
  var card_number = request.params.card_number
  var userName = request.params.userName
  var metadata = request.params.metadata
  var channel = request.params.channel
  var open_bank_code = request.params.open_bank_code
  var open_bank = request.params.open_bank
  var openid = request.params.openid   //微信用户openid

  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem")

  var today = new Date()
  // if(today.getDate() == 1 && today.getHours() >8 && today.getHours() < 22) {
  if (1) {
    switch (channel) {
      case 'allinpay': {
        pingpp.transfers.create({
          order_no: order_no,
          app: {id: GLOBAL_CONFIG.PINGPP_APP_ID},
          channel: "allinpay",// 通联支付
          amount: amount,
          currency: "cny",
          type: "b2c",
          extra: {
            card_number: card_number,  //收款人银行卡号或者存折号
            user_name: userName,  //收款人姓名 选填
            open_bank_code: open_bank_code, //开户银行编号 选填
            // open_bank: open_bank,  //开户银行 选填
            // prov: , //省份 选填
            // city: , //城市 选填
            // sub_bank: , //开户支行名称 选填
          },
          description: "Your Description",
          metadata: metadata,
        }, function (err, transfer) {
          if (err != null) {
            console.log("pingpp.transfers.create", err)
            response.error({
              errcode: 703,
              message: err.message,
            })
            return
          }

          if (transfer.metadata.userId) {
            var paymentInfo = {
              channel: transfer.channel,
              userId: transfer.metadata.userId,
              card_number: transfer.extra.card_number,
              user_name: transfer.extra.user_name,
              open_bank_code: transfer.extra.open_bank_code,
              open_bank: transfer.extra.open_bank,
              amount: (transfer.amount).toFixed(0) * 0.01,
            }
            return updatePaymentInfoInMysql(paymentInfo).then(() => {
              response.success({
                errcode: 0,
                message: 'allinpay create transfers success!',
                transfer: transfer,
              })
            }).catch((error) => {
              response.error(error)
            })
          } else {
            response.error({
              errcode: 1,
              message: "allinpay create transfers fail!",
            })
          }

        })
      }
        break
      case 'wx_pub': {
        pingpp.transfers.create({
          order_no: order_no,
          app: {id: GLOBAL_CONFIG.PINGPP_APP_ID},
          channel: "wx_pub",// 微信公众号支付
          amount: amount,
          currency: "cny",
          type: "b2c",
          recipient: openid, //微信openId
          extra: {
            // user_name: userName,
            // force_check: true,
          },
          description: "Your Description",
          metadata: metadata,
        }, function (err, transfer) {
          if (err != null) {
            console.log('pingpp.transfers.create', err)
            response.error({
              errcode: 1,
              message: err.message,
            })
            return
          }

          console.log(transfer)
          var query = new AV.Query('_User')
          query.equalTo("openid", transfer.recipient)
          query.first().then((user) => {
            if(user) {
              var paymentInfo = {
                channel: transfer.channel,
                userId: user.id,
                openid: transfer.recipient,
                amount: (transfer.amount).toFixed(0) * 0.01,
              }
              console.log("updatePaymentInfoInMysql", paymentInfo)
              updatePaymentInfoInMysql(paymentInfo).then(() => {
                response.success({
                  errcode: 0,
                  message: 'allinpay create transfers success!',
                  transfer: transfer,
                })
              }).catch((error) => {
                response.error(error)
              })
            } else {
              response.error({
                errcode: 1,
                message: "没有找到用户信息",
              })
            }
          }).catch((error) => {
            response.error(error)
          })

        })
      }
        break
      case 'alipay': {
        // pingpp.batchTransfers.create({
        //   "app": GLOBAL_CONFIG.PINGPP_APP_ID,
        //   "batch_no": order_no, // 批量付款批次号
        //   "channel": "alipay", // 目前只支持 alipay
        //   "amount": amount, // 批量付款总金额
        //   "description": "Your Description",
        //   "metadata": metadata,
        //   "recipients": [
        //     {
        //       "account": account, // 接收者支付宝账号
        //       "amount": amount, // 付款金额
        //       "name": userName // 接收者姓名
        //     }
        //   ],
        //   "currency": 'cny',
        //   "type": "b2c" // 付款类型，当前仅支持 b2c 企业付款
        // }, function (err, transfer) {
        //   if (err != null) {
        //     console.log(err)
        //     response.error({
        //       errcode: 1,
        //       message: err.message,
        //     })
        //     return
        //   }
        //
        //   if (transfer.metadata.userId && (transfer.recipients.length == 1)) {
        //     var paymentInfo = {
        //       alipay_account: transfer.recipients[0].account,
        //       userId: transfer.metadata.userId,
        //       id_name: transfer.recipients[0].name,
        //       amount: transfer.recipients[0].amount,
        //     }
        //     return updatePaymentInfoInMysql(paymentInfo).then(() => {
        //       response.success({
        //         errcode: 0,
        //         message: 'alipay create transfers success!',
        //         transfer: transfer,
        //       })
        //     }).catch((error) => {
        //       response.error(error)
        //     })
        //   } else {
        //     response.error({
        //       errcode: 1,
        //       message: "alipay create transfers fail!",
        //     })
        //   }
        //
        // })
      }
        break
      default:
        response.error({
          code: 702,
          message: "unknow channel!",
        })
        break
    }
  } else {
    response.error({
      code: 701,
      message: "transfer time error",
    })
  }
}

function transfersEvent(request, response) {
  var transfer = request.params.data.object


  return insertTransferInMysql(transfer).then(() => {
    response.success({
      errcode: 0,
      message: 'transfersEvent response success!',
    })
  }).catch((error) => {
    console.log("transfersEvent transfer into mysql fail!", error)
    response.error({
      errcode: 1,
      message: 'transfersEvent transfer into mysql fail!',
    })
  })
}

function idNameCardNumberIdentify(request, response) {
  var cardNumber = request.params.cardNumber
  var userName = request.params.userName
  var idNumber = request.params.idNumber
  var phoneNumber = request.params.phone
  var userId = request.params.userId
  var bankCode = request.params.bankCode

  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem");

  pingpp.identification.identify({
    type: 'bank_card',
    app: GLOBAL_CONFIG.PINGPP_APP_ID,
    data: {
      id_name: userName,
      id_number: idNumber,
      card_number: cardNumber,
      phone_number: phoneNumber
    }
  }, function (err, result) {
    if (!err) {
      console.log("pingpp.identification.identify fail:", err)
      response.error({
        errcode: 1,
        message: '[PingPP] identification identify failed!',
      })
      return
    }
    var cardInfo = {
      id_name: result.data.id_name,
      id_number: result.data.id_number,
      card_number: result.data.card_number,
      phone_number: result.data.phone_number,
      userId: userId,
      bankCode: bankCode,

    }
    return insertCardInMysql(cardInfo).then(() => {
      response.success({
        errcode: 0,
        message: '[PingPP] identification identify success!',
        result: result,
      })
    }).catch((error) => {
      console.log("insertCardInMysql fail!", error)
      response.error({
        errcode: 1,
        message: 'insertCardInMysql fail!',
      })
    })
  })
}

function getPaymentInfoByUserId(request, response) {
  var userId = request.params.userId

  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT `id_name`, `id_number`, `card_number`, `phone_number`, `balance`, `password`, `alipay_account`, `open_id`, `open_bank_code`, `open_bank` FROM `PaymentInfo` WHERE `userId` = ? "
    return mysqlUtil.query(conn, sql, [userId])
  }).then((queryRes) => {
    if (queryRes.results.length > 0) {
      var balance = queryRes.results[0].balance || 0
      var id_name = queryRes.results[0].id_name || undefined
      var id_number = queryRes.results[0].id_number || undefined
      var card_number = queryRes.results[0].card_number || undefined
      var phone_number = queryRes.results[0].phone_number || undefined
      var password = queryRes.results[0].phone_number ? true : false
      var alipay_account = queryRes.results[0].alipay_account || undefined
      var open_id = queryRes.results[0].open_id || undefined
      var open_bank_code = queryRes.results[0].open_bank_code || undefined
      var open_bank = queryRes.results[0].open_bank || undefined

      response.success({
        userId: userId,
        balance: balance,
        id_name: id_name,
        id_number: id_number,
        card_number: card_number,
        phone_number: phone_number,
        password: password,
        alipay_account: alipay_account,
        open_id: open_id,
        open_bank_code: open_bank_code,
        open_bank: open_bank,
      })
      return
    }
    response.error({
      errcode: 1,
      message: '未找到支付信息',
    })

  }).catch((err) => {
    response.error(err)
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
  })
}

function setPaymentPassword(request, response) {
  var userId = request.params.userId
  var password = request.params.password

  var cipher = Crypto.createCipher('aes-256-cbc', 'Ljyd')

  var pwd = cipher.update(password, 'utf8', 'hex')
  pwd += cipher.final('hex')

  return setPaymentPasswordInMysql(userId, pwd).then(() => {
    response.success({
      errcode: 0,
      message: 'setPaymentPassword success!',
    })
  }).catch((error) => {
    response.error({
      errcode: 1,
      message: 'setPaymentPassword fail!',
    })
  })
}

function paymentPasswordAuth(request, response) {
  var userId = request.params.userId
  var password = request.params.password
  var cipher = Crypto.createCipher('aes-256-cbc', 'Ljyd')

  var pwd = cipher.update(password, 'utf8', 'hex')
  pwd += cipher.final('hex')

  return authPaymentPasswordInMysql(userId, pwd).then(() => {
    response.success({
      errcode: 0,
      message: 'paymentPasswordAuth success!',
    })
  }).catch((error) => {
    response.error({
      errcode: 1,
      message: 'paymentPasswordAuth fail!',
    })
  })
}

function PingppFuncTest(request, response) {
  var mysqlConn = undefined


  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    return mysqlUtil.beginTransaction(conn)
  }).then((conn) => {
    return updatePaymentBalance(conn, '587d81fd61ff4b0065092427', 55)
  }).then(() => {
    return mysqlUtil.commit(mysqlConn)
  }).catch((err) => {
    if (mysqlConn) {
      console.log('transaction rollback')
      mysqlUtil.rollback(mysqlConn)
    }
    response.error({
      errcode: 1,
      message: '[PingPP] updatePaymentBalance fail!',
    })
  }).finally(() => {
    if (mysqlConn) {
      mysqlUtil.release(mysqlConn)
    }
    response.success({
      errcode: 0,
      message: '[PingPP] updatePaymentBalance success!',
    })
  })
}

function fetchDealRecords(request, response) {
  var userId = request.params.userId
  var limit = request.params.limit || 10
  var lastTime = request.params.lastTime
  var sql = ''
  var mysqlConn = undefined
  var promoterFunc = require('../Promoter')
  var promoterId = undefined
  var originalRecords = []
  var getShopByUserId = require('../Shop').getShopByUserId
  var getUserById = require('../Auth').getUserById
  var constructUserInfo = require('../Auth').constructUserInfo

  promoterFunc.getPromoterByUserId(userId).then((promoter) => {
    if (promoter) {
      promoterId = promoter.id
    }
  }).then(() => {
    return mysqlUtil.getConnection()
  }).then((conn) => {
    mysqlConn = conn
    if (promoterId) {
      if (lastTime) {
        sql = 'SELECT * FROM `DealRecords` WHERE `to` in (?, ?) AND `deal_time`<? ORDER BY `deal_time` DESC LIMIT ?'
        return mysqlUtil.query(conn, sql, [userId, promoterId, dateFormat(lastTime, 'isoDateTime'), limit])
      } else {
        sql = 'SELECT * FROM `DealRecords` WHERE `to` in (?, ?) ORDER BY `deal_time` DESC LIMIT ?'
        return mysqlUtil.query(conn, sql, [userId, promoterId, limit])
      }
    } else {
      if (lastTime) {
        sql = 'SELECT * FROM `DealRecords` WHERE `to`=? AND `deal_time`<? ORDER BY `deal_time` DESC LIMIT ?'
        return mysqlUtil.query(conn, sql, [userId, dateFormat(lastTime, 'isoDateTime'), limit])
      } else {
        sql = 'SELECT * FROM `DealRecords` WHERE `to`=? ORDER BY `deal_time` DESC LIMIT ?'
        return mysqlUtil.query(conn, sql, [userId, limit])
      }
    }
  }).then((queryRes) => {
    var ops = []
    queryRes.results.forEach((deal) => {
      var record = {
        from: deal.from,
        to: deal.to,
        cost: deal.cost,
        dealTime: deal.deal_time,
        dealType: deal.deal_type,
      }
      if (INVITE_SHOP == deal.deal_type) {
        ops.push(getShopByUserId(deal.from))
      } else if (INVITE_PROMOTER == deal.deal_type) {
        ops.push(promoterFunc.getPromoterById(deal.from, true))
      } else if (WITHDRAW == deal.deal_type) {
        ops.push(getUserById(deal.to))
      } else {
        ops.push(getUserById(deal.from))
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
      } else if (originalRecords[index].dealType == WITHDRAW) {
        elem.user = constructUserInfo(retValue)
      } else {
        elem.user = constructUserInfo(retValue)
      }
      elem.cost = originalRecords[index].cost
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
 * 设置提现手续费费率
 * @param request
 * @param response
 */
function setWithdrawFree(request, response) {
  var channel = request.params.channel
  var free = request.params.free

  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    response.error({errcode: 1, message: '设置费率失败，请重试！'})
  })

  client.setAsync(PREFIX + channel, free).then((free) => {
    response.success({
      errcode: 0,
      message: '设置费率成功！',
    })  }).finally(() => {
    client.quit()
  })

}

/**
 * @param channel  支付渠道
 * @returns free
 */
function getPaymentFreeByChannel(channel) {
  Promise.promisifyAll(redis.RedisClient.prototype)
  var client = redis.createClient(GLOBAL_CONFIG.REDIS_PORT, GLOBAL_CONFIG.REDIS_URL)
  client.auth(GLOBAL_CONFIG.REDIS_AUTH)
  client.select(GLOBAL_CONFIG.REDIS_DB)
  // 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server
  // 主从切换等原因造成短暂不可用导致应用进程退出。
  client.on('error', function (err) {
    return Promise.reject(err)
  })

  return client.getAsync(PREFIX + channel).then((free) => {
    return free
  }).finally(() => {
    client.quit()
  })

}
/**
 * 获取提现手续费费率
 * @param request
 * @param response
 */
function getWithdrawFree(request, response) {
  var channel = request.params.channel

  getPaymentFreeByChannel(channel).then((free) => {
    response.success({
      errcode: 0,
      free: free
    })
  }).catch(() => {
    response.error({errcode: 1, message: '获取费率失败'})
  })
}


var PingppFunc = {
  INVITE_PROMOTER: INVITE_PROMOTER,
  INVITE_SHOP: INVITE_SHOP,
  BUY_GOODS: BUY_GOODS,
  REWARD: REWARD,
  WITHDRAW: WITHDRAW,
  createPayment: createPayment,
  createTransfers: createTransfers,
  paymentEvent: paymentEvent,
  transfersEvent: transfersEvent,
  idNameCardNumberIdentify: idNameCardNumberIdentify,
  updatePaymentBalance: updatePaymentBalance,
  getPaymentInfoByUserId: getPaymentInfoByUserId,
  setPaymentPassword: setPaymentPassword,
  paymentPasswordAuth: paymentPasswordAuth,
  PingppFuncTest: PingppFuncTest,
  updateUserDealRecords: updateUserDealRecords,
  fetchDealRecords: fetchDealRecords,
  setWithdrawFree: setWithdrawFree,
  getWithdrawFree: getWithdrawFree
}

module.exports = PingppFunc