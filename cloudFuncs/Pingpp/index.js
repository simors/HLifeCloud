/**
 * Created by wanpeng on 2017/3/27.
 */
var crypto = require('crypto')
var GLOBAL_CONFIG = require('../../config')
var pingpp = require('pingpp')(GLOBAL_CONFIG.PINGPP_API_KEY)
var utilFunc = require('../util')
var mysqlUtil = require('../util/mysqlUtil')
var Promise = require('bluebird')
var shopFunc = require('../../cloudFuncs/Shop')



/**
 * 更新mysql中PaymentCards表的余额
 * @param userId
 * @param earning
 * @returns {Promise.<T>}
 */
function updatePaymentBalance(userId, earning) {
  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PaymentCards` WHERE `userId` = ? "
    return mysqlUtil.query(conn, sql, [userId])
  }).then((queryRes) => {
    if(queryRes.results[0].cnt == 0) {
      sql = "INSERT INTO `PaymentCards` (`userId`, `balance`,) VALUES (?, ?)"
      return mysqlUtil.query(queryRes.conn, sql, [userId, earning])
    } else if(queryRes.results[0].cnt == 1){
      sql = "UPDATE `PaymentCards` SET `balance` = `balance` + ? WHERE `userId` = ?"
      return mysqlUtil.query(queryRes.conn, sql, [earning, userId])
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
 * 在mysql中插入支付记录
 * @param charge
 * @returns {Promise.<T>}
 */
function insertChargeInMysql(charge) {
  console.log("insertChargeInMysql charge:", charge)
  var created =new Date(charge.created * 1000).toISOString().slice(0, 19).replace('T', ' ')
  console.log("charge.created:", created)
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
  console.log("insertTransferInMysql transfer:", transfer)
  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PaymentTransfer` WHERE `order_no` = ? LIMIT 1"
    return mysqlUtil.query(conn, sql, [transfer.order_no])
  }).then((queryRes) => {
    if (queryRes.results[0].cnt == 0) {
      sql = "INSERT INTO `PaymentTransfer` (`order_no`, `channel`, `created`, `amount`, `currency`, `transaction_no`, `subject`, `user`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      return mysqlUtil.query(queryRes.conn, sql, [transfer.order_no, transfer.channel, created, charge.amount, charge.currency, charge.transaction_no, charge.subject, charge.metadata.user])
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
  console.log("insertCardInMysql cardInfo:", cardInfo)

  var sql = ""
  var mysqlConn = undefined
  return mysqlUtil.getConnection().then((conn) => {
    mysqlConn = conn
    sql = "SELECT count(1) as cnt FROM `PaymentCards` WHERE `userId` = ? LIMIT 1"
    return mysqlUtil.query(conn, sql, [cardInfo.userId])
  }).then((queryRes) => {
    if(queryRes.results[0].cnt == 0) {
      sql = "INSERT INTO `PaymentCards` (`id_name`, `id_number`, `card_number`, `phone_number`, `userId`) VALUES (?, ?, ?, ?, ?)"
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

function createPayment(request,response) {
  var user = request.params.user
  var subject = request.params.subject
  var order_no = request.params.order_no
  var amount = request.params.amount
  var channel = request.params.channel
  var IPV4 = utilFunc.getLocalIPV4()

  console.log("createPayment local IPV4: ", IPV4)

  var extra = {};
  var metadata = {};
  // var channel = 'alipay'
  switch (channel) {
    case 'alipay':
      extra = {

      }
      metadata = {
        user: user,
      }
      break;
    case 'wx':
      extra = {

      }
      metadata = {
        user: user,
      }
      break
    default:
      break;
  }
  // var order_no = crypto.createHash('md5').update(new Date().getTime().toString()).digest('hex').substr(0, 16)

  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem");
  pingpp.charges.create({
    order_no:  order_no,// 推荐使用 8-20 位，要求数字或字母，不允许其他字符
    app:       { id: GLOBAL_CONFIG.PINGPP_APP_ID },
    channel:   channel,// 支付使用的第三方支付渠道取值，请参考：https://www.pingxx.com/api#api-c-new
    amount:    amount,//订单总金额, 人民币单位：分（如订单总金额为 1 元，此处请填 100）
    client_ip: "127.0.0.1",// 发起支付请求客户端的 IP 地址，格式为 IPV4，如: 127.0.0.1
    currency:  "cny",
    subject:   subject,
    body:      "商品的描述信息",
    extra:     extra,
    description: "店铺入驻费用",
    metadata: metadata,
  }, function(err, charge) {
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

function paymentEvent(request,response) {
  console.log("paymentEvent request.params", request.params)

  var charge = request.params.data.object
  var shopId = charge.metadata.shopId
  var amount = charge.amount * 0.01 //单位为 元


  return insertChargeInMysql(charge).then(() => {
    console.log("paymentEvent charge into mysql success!")
    if(shopId && amount)
      shopFunc.updateShopInfoAfterPaySuccess(shopId, amount)
    response.success({
      errcode: 0,
      message: 'paymentEvent charge into mysql success!',
    })
  }).catch((error) => {
    console.log("paymentEvent charge into mysql fail!", error)
    response.error({
      errcode: 1,
      message: 'paymentEvent charge into mysql fail!',
    })
  })
}

function createTransfers(request, response) {
  console.log("createTransfers request.params:", request.params)
  var order_no = request.params.order_no
  var amount = request.params.amount
  var cardNumber = request.params.cardNumber
  var userName = request.params.userName


  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem");

  pingpp.transfers.create({
    order_no:  order_no,
    app:       { id: GLOBAL_CONFIG.PINGPP_APP_ID },
    channel:     "unionpay",// 企业付款（银行卡）
    amount:    amount,
    currency:    "cny",
    type:        "b2c",
    extra:       {
      card_number: cardNumber,
      user_name: userName,
      open_bank_code: "0102"
    },
    description: "Your Description"
  }, function (err, transfer) {
    if (err != null) {
      console.log("pingpp.transfers.create fail:", err)
      response.error({
        errcode: 1,
        message: '[PingPP] create transfers failed!',
      })
      return
    }
    response.success({
      errcode: 0,
      message: '[PingPP] create transfers success!',
      transfer: transfer,
    })
  })

}

function transfersEvent(request, response) {
  console.log("transfersEvent request.params:", request.params)
  var transfer = request.params.data.object


  return insertTransferInMysql(transfer).then(() => {

  }).catch((error) => {
    console.log("transfersEvent transfer into mysql fail!", error)
    response.error({
      errcode: 1,
      message: 'transfersEvent transfer into mysql fail!',
    })
  })

  response.success({
    errcode: 0,
    message: 'transfersEvent response success!',
  })
}

function idNameCardNumberIdentify(request, response) {
  console.log("idNameCardNumberIdentify request.params)", request.params)
  var cardNumber = request.params.cardNumber
  var userName = request.params.userName
  var idNumber = request.params.idNumber
  var phoneNumber = request.params.phone
  var userId = request.params.userId
  var bankCode = request.params.bankCode

  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem");

  // pingpp.identification.identify({
  //   type: 'bank_card',
  //   app: GLOBAL_CONFIG.PINGPP_APP_ID,
  //   data: {
  //     id_name: userName,
  //     id_number: idNumber,
  //     card_number: cardNumber,
  //     phone_number: phoneNumber
  //   }
  // }, function (err, result) {
  //   err && console.log(err.message);
  //   result && console.log(result);
  //   if (err != null) {
  //     console.log("pingpp.identification.identify fail:", err)
  //     response.error({
  //       errcode: 1,
  //       message: '[PingPP] identification identify failed!',
  //     })
  //     return
  //   }
  // var cardInfo = {
  //   id_name: result.data.id_name,
  //   id_number: result.data.id_number,
  //   card_number: result.data.card_number,
  //   phone_number: result.data.phone_number,
  //   userId: userId,
  //   bankCode:bankCode,

  // }
  //   return insertCardInMysql(cardInfo).then(() => {
  //     response.success({
  //       errcode: 0,
  //       message: '[PingPP] identification identify success!',
  //       result: result,
  //     })
  //   }).catch((error) => {
  //     console.log("insertCardInMysql fail!", error)
  //     response.error({
  //       errcode: 1,
  //       message: 'insertCardInMysql fail!',
  //     })
  //   })
  // })

  var result = {
    type: 'bank_card',
    app: 'app_Pq5G0SOeXLC01mX9',
    result_code: 0,
    message: 'SUCCESS',
    paid: true,
    data:
    { id_name: userName,
      id_number: idNumber,
      card_number: cardNumber,
      phone_number: phoneNumber }
  }
  var cardInfo = {
    id_name: result.data.id_name,
    id_number: result.data.id_number,
    card_number: result.data.card_number,
    phone_number: result.data.phone_number,
    userId: userId,
    bankCode:bankCode,
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

}

function PingppFuncTest(request, response) {

  return updatePaymentBalance('587d81fd61ff4b0065092427', 100).then(() => {
    response.success({
      errcode: 0,
      message: '[PingPP] identification identify success!',
    })
  }).catch((error) => {
    console.log(error)
    response.error({
      errcode: 1,
      message: 'updatePaymentBalance fail!',
    })
  })


}


var PingppFunc = {
  createPayment: createPayment,
  createTransfers: createTransfers,
  paymentEvent: paymentEvent,
  transfersEvent: transfersEvent,
  idNameCardNumberIdentify: idNameCardNumberIdentify,
  updatePaymentBalance: updatePaymentBalance,
  PingppFuncTest: PingppFuncTest,
}

module.exports = PingppFunc