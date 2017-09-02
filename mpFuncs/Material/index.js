/**
 * Created by wanpeng on 2017/7/26.
 */
var Promise = require('bluebird');
var wechat_api = require('../util/wechatUtil').wechat_api

function uploadMaterial(filepath) {
  return new Promise(function (resolve, reject) {
    wechat_api.uploadMaterial(filepath, 'image', function (err, result) {
      if(err) {
        console.log("uploadMaterial", err)
        reject(err)
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

var mpMaterialFuncs = {
  uploadMaterial: uploadMaterial
}

module.exports = mpMaterialFuncs