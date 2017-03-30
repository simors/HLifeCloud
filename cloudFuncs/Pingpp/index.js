/**
 * Created by wanpeng on 2017/3/27.
 */
var crypto = require('crypto')
var GLOBAL_CONFIG = require('../../config')
var pingpp = require('pingpp')(GLOBAL_CONFIG.PINGPP_API_KEY)
var utilFunc = require('../util')


function createPayment(request,response) {
  var order_no = request.params.order_no
  var amount = request.params.amount
  var channel = request.params.channel
  var IPV4 = utilFunc.getLocalIPV4()

  console.log("createPayment local IPV4: ", IPV4)


  // var channel = 'alipay'
  var extra = {};
  // var order_no = crypto.createHash('md5').update(new Date().getTime().toString()).digest('hex').substr(0, 16)

  pingpp.setPrivateKeyPath(__dirname + "/rsa_private_key.pem");

  pingpp.charges.create({
    order_no:  order_no,// 推荐使用 8-20 位，要求数字或字母，不允许其他字符
    app:       { id: GLOBAL_CONFIG.PINGPP_APP_ID },
    channel:   channel,// 支付使用的第三方支付渠道取值，请参考：https://www.pingxx.com/api#api-c-new
    amount:    amount,//订单总金额, 人民币单位：分（如订单总金额为 1 元，此处请填 100）
    client_ip: "127.0.0.1",// 发起支付请求客户端的 IP 地址，格式为 IPV4，如: 127.0.0.1
    currency:  "cny",
    subject:   "Your Subject",
    body:      "Your Body",
    extra:     extra
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
  console.log("paymentEvent request.params:", request.params)

  response.success({
    errcode: 0,
    message: 'paymentEvent response success!',
  })
}


var PingppFunc = {
  createPayment: createPayment,
  paymentEvent: paymentEvent,

}

module.exports = PingppFunc