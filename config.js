/**
 * Created by yangyang on 2017/3/24.
 */

// redis配置
var REDIS_URL = "120.77.220.234"
var REDIS_PORT = 6379
var DEBUG_REDIS = 0
var PRE_REDIS = 1
var PROD_REDIS = 2
var REDIS_DB = 0
var REDIS_AUTH = "Simors2017"

// mysql数据库配置
var MYSQL_HOST = '120.77.220.234'
var MYSQL_USER = ''
var MYSQL_PWD = ''
var MYSQL_DB = ''
var MYSQL_DEV_USER = 'simors'
var MYSQL_DEV_PWD = 'Simors2017'
var MYSQL_DEV_DB = 'hlife_dev'
var MYSQL_PRE_USER = 'xiaojee'
var MYSQL_PRE_PWD = 'Xiaojee2017'
var MYSQL_PRE_DB = 'hlife_pre'
var MYSQL_PROD_USER = 'xiaojeePro'
var MYSQL_PROD_PWD = 'XjDayDayUpGo!!'
var MYSQL_PROD_DB = 'hlife_pro'

//Ping++应用配置
var PINGPP_APP_ID = ""
var PINGPP_TEST_API_KEY = "sk_test_fbTiHOOG0008r9Sq10GWXXnT" //Secret Key
var PINGPP_LIVE_API_KEY = "sk_live_P044i19GCS8SyT84eTvbHmbH" //Secret Key

var PINGPP_DEV_APP_ID = "app_aX1mbDu5G08OP0i9" //ping++ 汇邻优店-DEV应用 Id

var PINGPP_PRE_APP_ID = "app_Pq5G0SOeXLC01mX9" //ping++ 汇邻优店-PRE应用 Id

var PINGPP_PRO_APP_ID = "app_C8ub5OWfvHS4ybLq" //ping++ 汇邻优店-PRO应用 Id

//应用下载链接配置
var APP_DOWNLOAD_LINK = "http://a.app.qq.com/o/simple.jsp?pkgname=com.hlife"

//微信公众平台配置
var MP_SERVER_DOMAIN = "http://dev.lean.ngrok.io"
var MP_CLIENT_DOMAIN = "http://dev.mp.ngrok.io"
var REWARD_TMP_ID = "KgqlsGloHZnWHp9Bhkd-KP56Y4wkR0kC2juJHABwjf8" //微信模版消息id：打赏功能
var WITHDRAW_TMP_ID = ""  //微信模版消息id：提现通知
var GOODS_TMP_ID = ""   //微信模版消息id：商品交易支付通知
var SHOP_TMP_ID = ""  //微信模版消息id：邀请店铺支付通知

var wxConfig = undefined


if (process.env.LEANCLOUD_APP_ID === 'K5Rltwmfnxd5pYjMsOFFL0kT-gzGzoHsz') {
  REDIS_DB = DEBUG_REDIS
  MYSQL_USER = MYSQL_DEV_USER
  MYSQL_PWD = MYSQL_DEV_PWD
  MYSQL_DB = MYSQL_DEV_DB
  PINGPP_APP_ID = PINGPP_DEV_APP_ID

  MP_SERVER_DOMAIN = "http://dev.lean.ngrok.io"
  MP_CLIENT_DOMAIN = "http://dev.mp.ngrok.io"
  REWARD_TMP_ID = "KgqlsGloHZnWHp9Bhkd-KP56Y4wkR0kC2juJHABwjf8"
  wxConfig = {
    token: 'huilinyoudian2017dev',
    appid: 'wx310b23ce34f394a0',
    encodingAESKey: 'K65BlkT0U2lH1SntekBotsAhKX0VLo94bMTQDAZudIY',
    appSecret: '7adbbfa310520160c6a3bc63bfe05d0b',
    checkSignature: true,
  }

} else if (process.env.LEANCLOUD_APP_ID === 'TUVjJ5HHNmopfJeREa4IcB1T-gzGzoHsz') {
  REDIS_DB = PRE_REDIS
  MYSQL_USER = MYSQL_PRE_USER
  MYSQL_PWD = MYSQL_PRE_PWD
  MYSQL_DB = MYSQL_PRE_DB
  PINGPP_APP_ID = PINGPP_PRE_APP_ID

  MP_SERVER_DOMAIN = "http://hlyd-pre.leanapp.cn"
  MP_CLIENT_DOMAIN = "http://139.196.84.116"
  REWARD_TMP_ID = "GRV5xvTTwrOQRhza5Ngm63V7VvqP_hQknAzhhdSFIDQ"

  wxConfig = {
    token: 'huilinyoudian2017pre',
    appid: 'wx34ac208b373814d2',
    encodingAESKey: 'K65BlkT0U2lH1SntekBotsAhKX0VLo94bMTQDAZudIY',
    appSecret: 'd121a1921db870cc3e37f148cb7cc257',
    checkSignature: true,
  }
} else if (process.env.LEANCLOUD_APP_ID === 'pHIMCdWo3VQX09TKFuU9AGdd-gzGzoHsz') {
  REDIS_DB = PROD_REDIS
  MYSQL_USER = MYSQL_PROD_USER
  MYSQL_PWD = MYSQL_PROD_PWD
  MYSQL_DB = MYSQL_PROD_DB
  PINGPP_APP_ID = PINGPP_PRO_APP_ID

  MP_SERVER_DOMAIN = "http://share.xiaojee.cn"
  MP_CLIENT_DOMAIN = "http://120.77.220.234"
  REWARD_TMP_ID = "ELAwKkLzY0dnVYaYGWbuJIOXMTuVwz7qKDO2-TAWaL4"
  wxConfig = {
    token: 'huilinyoudian2017pro',
    appid: 'wxc13204ac7a37acb4',
    encodingAESKey: 'tZJ0FCYMKL3vdCTlj9Mj8VGmSJIBz0rNDjci4ncmqRn',
    appSecret: '6d98755c0738ee954b7f17c535aa0725',
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

}

module.exports = GLOBAL_CONFIG