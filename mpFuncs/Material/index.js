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

function getMaterialIdByName(type, mediaName) {
  return new Promise((resolve, reject) => {
    wechat_api.getMaterialCount((err, countRes) => {
      if (err) {
        reject()
        return
      }
      var count = 0
      switch (type) {
        case 'voice':
          count = countRes.voice_count
          break
        case 'video':
          count = countRes.video_count
          break
        case 'image':
          count = countRes.image_count
          break
        case 'news':
          count = countRes.news_count
          break
        default:
          count = 0
      }
      if (count == 0) {
        reject()
        return
      }
      wechat_api.getMaterials(type, 0, count, (err, result) => {
        if (err) {
          reject()
          return
        }
        var materialItems = result.item
        var material = undefined
        if (type != 'news') {
          material = materialItems.find((item) => {
            return item.name == mediaName
          })
        } else {
          material = materialItems.find((item) => {
            return item.content.news_item[0].title == mediaName
          })
        }
        if (material) {
          resolve(material.media_id)
        } else {
          reject()
        }
      })
    })
  })
}

var mpMaterialFuncs = {
  uploadMaterial: uploadMaterial,
  getMaterialIdByName: getMaterialIdByName,
}

module.exports = mpMaterialFuncs