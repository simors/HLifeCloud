/**
 * Created by lilu on 2017/4/17.
 */
var AV = require('leanengine');

function disableTopicByUser(request,response){
  var id = request.params.id
  var topic = AV.Object.createWithoutData('Topics',id)
  topic.set('status',0)
  topic.save().then(()=>{
    response.success({errcode: 0})
  },(err)=>{response.error({errcode:1,message:err})})
}



var topicFunc = {
  disableTopicByUser: disableTopicByUser,

}

module.exports = topicFunc