/**
 * Created by zachary on 2017/3/27.
 */
var Promise = require('bluebird');
var AV = require('leancloud-storage');
var Realtime = require('leancloud-realtime').Realtime;
var TypedMessagesPlugin = require('leancloud-realtime-plugin-typed-messages').TypedMessagesPlugin;
var SysMessage = require('./SysMessageType');
var MESSAGE_TYPES = require('./MESSAGE_TYPES');

var realTime = null;

function sendSystemMessage(convOptions, msgOptions) {
  var realTime = createRealTime();

  registerCustomMessageType(realTime, [SysMessage]);

  createIMClient(realTime).then(function(client){
    if(client) {
      var defaultOptions = {
        members: [],
        name: '系统通知',
        sys: true,
      }
      Object.assign(defaultOptions, convOptions)
      createConversation(client, defaultOptions).then(function(conversation){
        if(conversation) {
          var defaultMsgOptions = {
            text: '',
            attrs: {}
          }
          Object.assign(defaultMsgOptions, msgOptions)
          var sysMsg = createTypedMessage(MESSAGE_TYPES.MSG_SYSTEM, '')
          sysMsg.setText(defaultMsgOptions.text)
          sysMsg.setAttributes(defaultMsgOptions.attrs)
          send(conversation, sysMsg).then(function(isSuccess){
            if(isSuccess) {
              closeIMClient(client)
            }
          })
        }
      })
    }
  })
}

/**
 * 初始化实时通讯SDK
 * @param options
 */
function createRealTime(options) {
  if(!realTime) {
    var defaultOptions = {
      appId: process.env.LEANCLOUD_APP_ID,
      region: 'cn',
      pushOfflineMessages: true, //启用推送离线消息模式（默认为发送未读消息通知模式）
      noBinary: true, //设置 WebSocket 使用字符串格式收发消息（默认为二进制格式）。适用于 WebSocket 实现不支持二进制数据格式的情况（如 React Native）
      ssl: true, //使用 wss 进行连接
      plugins: [TypedMessagesPlugin] //加载插件
    }

    Object.assign(defaultOptions, options)

    //初始化实时通讯SDK
    realTime = new Realtime(defaultOptions)
  }
  return realTime;
}

/**
 * 注册消息类
 * @param realTime
 * @param customMessageTypes Array
 */
function registerCustomMessageType(realTime, customMessageTypes) {
  // 注册消息类，否则收到消息时无法自动解析为 SysMessage
  if(realTime && customMessageTypes && customMessageTypes.length) {
    customMessageTypes.forEach(function(item){
      realTime.register(item);
    })
  }
}

/**
 * 文本消息 -1
 * 图像　　 -2
 * 音频　　 -3
 * 视频　　 -4
 * 地理位置 -5
 * 通用文件 -6
 * 系统消息 1
 * @param messageType  String         消息类型
 * @param content      Object|String 	消息内容
 * @returns {*}
 */
function createTypedMessage(messageType, content) {
  switch (messageType) {
    case MESSAGE_TYPES.MSG_SYSTEM:
      return new SysMessage(content)
    case AV.FileMessage.TYPE:
      return new AV.FileMessage(content)
    case AV.ImageMessage.TYPE:
      return new AV.ImageMessage(content)
    case AV.AudioMessage.TYPE:
      return new AV.AudioMessage(content)
    case AV.VideoMessage.TYPE:
      return new AV.VideoMessage(content)
    case AV.LocationMessage.TYPE:
      return new AV.LocationMessage(content)
    default:
      return new AV.TextMessage(content)
  }
}

/**
 *创建一个即时通讯客户端，多次创建相同 id 的客户端会返回同一个实例
 * @param realTime, id, clientOptions, tag
 * Name	          Type	   Attributes	  Description
 * id	            String	 <optional>   客户端 id，如果不指定，服务端会随机生成一个
 * clientOptions	Object	 <optional>   详细参数 @see IMClient
 *    @IMClient:
 *        signatureFactory              function	 <optional>   open session 时的签名方法
 *        conversationSignatureFactory	function	 <optional>   对话创建、增减成员操作时的签名方法
 * tag	          String	 <optional>   客户端类型标记，以支持单点登录功能(web, mobile)
 *
 * @return {Promise.<IMClient>}
 */
function createIMClient(realTime, id, clientOptions, tag) {
  Object.assign({}, clientOptions);
  tag = tag || 'web';
  return new Promise(function(resolve, reject){
    if(realTime) {
      realTime.createIMClient(id, clientOptions, tag).then((client) => {
        resolve(client)
      }).catch((error) => {
        console.log('createIMClient.error--->>>', error)
        resolve(null)
      })
    }else {
      resolve(null)
    }
  })
}

/**
 * 关闭客户端
 * @param client
 */
function closeIMClient(client) {
  return new Promise(function(resolve, reject){
    if(client) {
      client.close().then(function(){
        resolve(true)
      }).catch((err) => {
        console.log('createConversation===>>>', err)
        resolve(false)
      })
    }else {
      resolve(false)
    }
  })
}

/**
 * 创建一个 conversation
 * 除了下列字段外的其他字段将被视为对话的自定义属性
 * @param client
 * @param options
 * Name	      Type	          Attributes	Default	 Description
 * members    Array.<String>  <required>           对话的初始成员列表，默认包含当前 client
 * name       String          <optional>           对话的名字
 * sys	      Boolean	        <optional>           系统对话
 * transient	Boolean	        <optional>  false	   暂态会话
 * unique	    Boolean	        <optional>  false	   唯一对话，当其为 true 时，如果当前已经有相同成员的对话存在则返回该对话，否则会创建新的对话
 * @return {Promise.<Conversation>}
 */
function createConversation(client, options) {
  return new Promise(function(resolve, reject){
    if(client) {
      client.createConversation(options).then(function(conversation){
        resolve(conversation)
      }).catch((err) => {
        console.log('createConversation===>>>', err)
        resolve(null)
      })
    }else {
      resolve(null)
    }
  })
}

/**
 * 发送消息
 * @param conversation     回话实例对象
 * @param message          消息，Message 及其子类的实例
 * @param options          since v3.3.0，发送选项
 *  transient  Boolean  since v3.3.1，是否作为暂态消息发送
 *  receipt    Boolean  是否需要送达回执，仅在普通对话中有效
 *  will       Boolean  since v3.4.0，是否指定该消息作为「掉线消息」发送，「掉线消息」会延迟到当前用户掉线后发送，常用来实现「下线通知」功能
 *  priority   MessagePriority   消息优先级，仅在暂态对话中有效， see: MessagePriority
 *    AV.MessagePriority.HIGH    Number  高
 *    AV.MessagePriority.NORMAL  Number  普通
 *    AV.MessagePriority.LOW     Number  低
 *  pushData  Object 消息对应的离线推送内容，如果消息接收方不在线，会推送指定的内容
 *    {
 *      "data": {
 *        "alert": "消息内容",
 *        "category": "消息",
 *        "badge": 1,
 *        "sound": "声音文件名，前提在应用里存在",
 *        "custom-key": "由用户添加的自定义属性，custom-key 仅是举例，可随意替换"
 *      }
 *    }
 */
function send(conversation, message, options) {
  return new Promise(function(resolve, reject){
    if(conversation && message) {
      conversation.send(message, options).then(function(sendedMessage){
        resolve(true, sendedMessage)
      }).catch((err) => {
        console.log('send===>>>', err)
        resolve(false)
      })
    }else {
      resolve(false)
    }
  })
}