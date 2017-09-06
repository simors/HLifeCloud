/**
 * Created by wanpeng on 2017/9/6.
 */
var Promise = require('bluebird');
var wechat_api = require('../util/wechatUtil').wechat_api

function uploadMedia(filepath, type) {
  return new Promise(function (resolve, reject) {
    wechat_api.uploadMedia(filepath, type, function (err, result) {
      if(err) {
        console.log("uploadMedia", err)
        reject(err)
        return
      }
      var mediaId = result.media_id
      var type = result.type
      var created_at = result.created_at
      resolve({
        type: type,
        mediaId: mediaId,
        created_at: created_at,
      })
    })
  })
}

var mpMediaFuncs = {
  uploadMedia: uploadMedia,
}

module.exports = mpMediaFuncs