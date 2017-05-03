/**
 * Created by wanpeng on 2017/5/2.
 */
'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var QRCode = require('qrcode')

router.get('/:device', function(req, res, next) {
  var device = req.params.device
  console.log("device:", device)
  switch (device) {
    case 'ios':
      QRCode.toDataURI('https://itunes.apple.com/lookup?id=1224852246', function (err, url) {
        if(err) {
          console.log("Failed to generate QRCode:", err)
          next(new Error('Failed to generate QRCode ' + err))
        }
        res.render('appDownload', {
          title: 'ios下载',
          downloadQrCode: url,
        })
      })
      break;
    case 'android':
      break;
    default:
      break;
  }
});

module.exports = router;
