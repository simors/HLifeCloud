/**
 * Created by yangyang on 2017/3/23.
 */
var inviteCodeFunc = require('./inviteCode')

var utilFunc = {
  getInvitationCode: inviteCodeFunc.getInvitationCode,
  verifyInvitationCode: inviteCodeFunc.verifyInvitationCode,
}

module.exports = utilFunc