/**
 * Created by yangyang on 2017/3/24.
 */

// redis配置
var REDIS_URL = process.env.REDIS_URL
var REDIS_PORT = process.env.REDIS_PORT
var DEBUG_REDIS = 0
var PRE_REDIS = 1
var PROD_REDIS = 2
var REDIS_DB = 0
var REDIS_AUTH = process.env.REDIS_AUTH

// mysql数据库配置
var MYSQL_HOST = process.env.MYSQL_HOST
var MYSQL_USER = process.env.MYSQL_USER
var MYSQL_PWD = process.env.MYSQL_PWD
var MYSQL_DB = process.env.MYSQL_DB

//Ping++应用配置
var PINGPP_APP_ID = ""
var PINGPP_TEST_API_KEY = "sk_test_fbTiHOOG0008r9Sq10GWXXnT" //Secret Key
var PINGPP_LIVE_API_KEY = process.env.PINGPP_LIVE_API_KEY //Secret Key

var PINGPP_DEV_APP_ID = "app_aX1mbDu5G08OP0i9" //ping++ 汇邻优店-DEV应用 Id

var PINGPP_PRE_APP_ID = "app_Pq5G0SOeXLC01mX9" //ping++ 汇邻优店-PRE应用 Id

var PINGPP_PRO_APP_ID = "app_C8ub5OWfvHS4ybLq" //ping++ 汇邻优店-PRO应用 Id

//应用下载链接配置
var APP_DOWNLOAD_LINK = "http://a.app.qq.com/o/simple.jsp?pkgname=com.hlife"

//微信公众平台配置
var MP_CLIENT_DOMAIN = 'http://dev.mp.ngrok.io'
const MP_CLIENT_DOMAIN_DEV = 'http://dev.mp.ngrok.lvyii.com'
const MP_CLIENT_DOMAIN_STAGE = 'http://dev.xiaojee.cn:6300'
const MP_CLIENT_DOMAIN_PRO = 'http://admin.xiaojee.cn:6300'

var MP_SERVER_DOMAIN = "http://hlyd_mp_dev.ngrok.io"
var REWARD_TMP_ID = "KgqlsGloHZnWHp9Bhkd-KP56Y4wkR0kC2juJHABwjf8" //微信模版消息id：打赏功能
var WITHDRAW_TMP_ID = "cEf4nAF5GSIiPB6Sen2FXOxPQBsPeTTkbnKOIxBHVFw"  //微信模版消息id：提现通知
var GOODS_TMP_ID = "piiTpGgWBBcvZfATnnhrf7unoj8yQIUjQeMnSDVS67g"   //微信模版消息id：商品交易支付通知
var SHOP_TMP_ID = "4m3VocRQTsLWxVgEKzOwBWMoZQOfh7ToyHqlpQruS3g"  //微信模版消息id：邀请店铺支付通知
var INVITER_TMP_ID = "zVnC2WLMts3fJCnz2qkXAmVTGXtVprrYn6zthreOan0"

var wxConfig = undefined


if (process.env.LEANCLOUD_APP_ID === 'K5Rltwmfnxd5pYjMsOFFL0kT-gzGzoHsz') {
  REDIS_DB = DEBUG_REDIS
  PINGPP_APP_ID = PINGPP_DEV_APP_ID

  MP_SERVER_DOMAIN = "http://hlyd-dev.leanapp.cn"
  MP_CLIENT_DOMAIN = MP_CLIENT_DOMAIN_DEV
  REWARD_TMP_ID = "GRV5xvTTwrOQRhza5Ngm63V7VvqP_hQknAzhhdSFIDQ"
  SHOP_TMP_ID = "Q2IF95JstKqwwtv9QOBLONTOhA9Dep2JuVLDJKv7BvM"
  GOODS_TMP_ID = "MLQiVmfbpgIaNvSLp45GVv-H2JGmhXo79Q88kFVcHdM"
  WITHDRAW_TMP_ID = "cI49vYLgEK20N6o59nEi08kSc2f_jLyvYMJr8Dx7nNs"
  INVITER_TMP_ID = "A_ugyWk9ZALz0FukC42Oalf8wwqhrIPudPSTZIvzqKg"

  wxConfig = {
    token: 'huilinyoudian2017dev',
    appid: 'wx3dfde3f7184c8c51',
    encodingAESKey: 'K65BlkT0U2lH1SntekBotsAhKX0VLo94bMTQDAZudIY',
    appSecret: 'd8ad2d32d51a72e3efb3be16a628139a',
    checkSignature: true,
  }

} else if (process.env.LEANCLOUD_APP_ID === 'TUVjJ5HHNmopfJeREa4IcB1T-gzGzoHsz') {
  REDIS_DB = PRE_REDIS
  PINGPP_APP_ID = PINGPP_PRE_APP_ID

  MP_SERVER_DOMAIN = "http://hlyd-pre.leanapp.cn"
  MP_CLIENT_DOMAIN = MP_CLIENT_DOMAIN_STAGE
  REWARD_TMP_ID = "K6Y6On2Ya12S8N32rT8GsDSyrRZGWf9K10HLWF8bMDo"
  SHOP_TMP_ID = "oMEz008Y4ThT1y_8ZFTe5VRdft-DmkcONVc-3Syty0k"
  GOODS_TMP_ID = "-yvrwRNpJEDp19XDMUCjE_wC5RISR5Sl56RRxT1528M"
  WITHDRAW_TMP_ID = "kowSnrTAXf9VjDtF5iFvyChSJNxyMPfhHcZ9gbbA4zI"
  INVITER_TMP_ID = "_b0VCP2HDejrZDqv7wnIhdE5RRL1jeVLSz7dUOpJKbA"
  wxConfig = {
    token: 'huilinyoudian2017pre',
    appid: 'wxd1cc733cd20fdaea',
    encodingAESKey: 'K65BlkT0U2lH1SntekBotsAhKX0VLo94bMTQDAZudIY',
    appSecret: 'dab2ea29d6e68629cbec6ca1317d4239',
    checkSignature: true,
  }
} else if (process.env.LEANCLOUD_APP_ID === 'pHIMCdWo3VQX09TKFuU9AGdd-gzGzoHsz') {
  REDIS_DB = PROD_REDIS
  PINGPP_APP_ID = PINGPP_PRO_APP_ID

  MP_SERVER_DOMAIN = "http://share.xiaojee.cn"
  MP_CLIENT_DOMAIN = MP_CLIENT_DOMAIN_PRO
  REWARD_TMP_ID = "ELAwKkLzY0dnVYaYGWbuJIOXMTuVwz7qKDO2-TAWaL4"
  SHOP_TMP_ID = "NzBXdCA-95TJnjJYMU8RGPRKhKs4AhNO_fCc9wnRD_w"
  GOODS_TMP_ID = "yosEBCYJmJotmcwSYedRqszjwEiQRnHQTHZ--g-1wG4"
  WITHDRAW_TMP_ID = "KOdhXfTtCpaCLyrrawOZQ-uvjkCn6woH7vbWgoZ5SCY"
  INVITER_TMP_ID = "sz1HhceF0hT0QuXF3w9-oHJNGWfFnmkca0uX1_8eKd4"

  wxConfig = {
    token: 'huilinyoudian2017pro',
    appid: 'wxc13204ac7a37acb4',
    encodingAESKey: 'vsw15YrAgUavFsNvHdEAd3iRLpgigQDbOutnvwPDD0H',
    appSecret: '1c202cb984f8dec7557bb11db88934c8',
    checkSignature: true,
  }
}


var GLOBAL_CONFIG = {
  REDIS_AUTH: REDIS_AUTH,
  REDIS_URL: REDIS_URL,
  REDIS_PORT: REDIS_PORT,
  REDIS_DB: REDIS_DB,

  MYSQL_HOST: MYSQL_HOST,
  MYSQL_USER: MYSQL_USER,
  MYSQL_PWD: MYSQL_PWD,
  MYSQL_DB: MYSQL_DB,

  PINGPP_APP_ID: PINGPP_APP_ID,
  PINGPP_API_KEY: PINGPP_LIVE_API_KEY,

  APP_DOWNLOAD_LINK: APP_DOWNLOAD_LINK,

  wxConfig: wxConfig,

  MP_SERVER_DOMAIN: MP_SERVER_DOMAIN,
  MP_CLIENT_DOMAIN: MP_CLIENT_DOMAIN,
  REWARD_TMP_ID: REWARD_TMP_ID,
  WITHDRAW_TMP_ID: WITHDRAW_TMP_ID,
  GOODS_TMP_ID: GOODS_TMP_ID,
  SHOP_TMP_ID: SHOP_TMP_ID,
  INVITER_TMP_ID: INVITER_TMP_ID,

}

module.exports = GLOBAL_CONFIG