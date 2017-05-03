/**
 * Created by wanpeng on 2017/5/3.
 */

'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var QRCode = require('qrcode')

router.get('/:code', function(req, res, next) {
  var code = req.params.code
  console.log("code:", code)
  QRCode.toDataURI(code, function (err, url) {
    if(err) {
      console.log("Failed to generate QRCode:", err);
      next(new Error('Failed to generate QRCode ' + err));
    }
    res.render('inviteCodeShare', {
      title: '邀请码',
      downloadQrCode: url,
      code: code,
    })
  })

});

module.exports = router;
