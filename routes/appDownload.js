/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var QRCode = require('qrcode');
var GLOBAL_CONFIG = require('../config')

router.get('/', function(req, res, next) {

  QRCode.toDataURI(GLOBAL_CONFIG.APP_DOWNLOAD_LINK, function (err, url) {
    if(err) {
      console.log("Failed to generate QRCode:", err)
      next(new Error('Failed to generate QRCode ' + err))
    }
    res.render('appDownload', {
      title: '应用下载',
      downloadQrCode: url,
      appDownloadLink: GLOBAL_CONFIG.APP_DOWNLOAD_LINK,
    })
  })
});

module.exports = router;
