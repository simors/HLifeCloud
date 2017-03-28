/**
 * Created by zachary on 2017/3/27.
 */
var TypedMessage = require('leancloud-realtime').TypedMessage;
var messageType = require('leancloud-realtime').messageType;
var messageField = require('leancloud-realtime').messageField;
var inherit = require('inherit');
var MESSAGE_TYPES = require('./MESSAGE_TYPES');

// 定义 SysMessage 类，用于发送和接收所有的用户操作消息
var SysMessage = inherit(TypedMessage);

// 指定 type 类型，可以根据实际换成其他正整数
messageType(MESSAGE_TYPES.MSG_SYSTEM)(SysMessage);

// 申明需要发送字段
var fields = ['convId', 'msgId', 'msgType', 'data'];
messageField(fields)(SysMessage);

module.exports = SysMessage;