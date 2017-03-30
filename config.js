/**
 * Created by yangyang on 2017/3/24.
 */

var REDIS_URL = "120.77.220.234"
var REDIS_PORT = 6379
var DEBUG_REDIS = 0
var PRE_REDIS = 1
var PROD_REDIS = 2
var REDIS_DB = 0
var REDIS_AUTH = "Simors2017"

var PINGPP_APP_ID = "app_Pq5G0SOeXLC01mX9" //ping++ 邻家优店应用Id
var PINGPP_API_KEY = "sk_test_fbTiHOOG0008r9Sq10GWXXnT" //Secret Key


if (process.env.LEANCLOUD_APP_ID === 'K5Rltwmfnxd5pYjMsOFFL0kT-gzGzoHsz') {
  REDIS_DB = DEBUG_REDIS
} else if (process.env.LEANCLOUD_APP_ID === 'TUVjJ5HHNmopfJeREa4IcB1T-gzGzoHsz') {
  REDIS_DB = PRE_REDIS
} else {
  REDIS_DB = PROD_REDIS
}

var GLOBAL_CONFIG = {
  REDIS_AUTH: REDIS_AUTH,
  REDIS_URL: REDIS_URL,
  REDIS_PORT: REDIS_PORT,
  REDIS_DB: REDIS_DB,
  PINGPP_APP_ID: PINGPP_APP_ID,
  PINGPP_API_KEY: PINGPP_API_KEY,
}

module.exports = GLOBAL_CONFIG