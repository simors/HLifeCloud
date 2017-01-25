/**
 * Created by lilu on 2017/1/21.
 */
var numberUtils = require('./numberUtils');
var util = require('./util');

function commentFromLeancloud(result){
 // console.log('rsult===>',result)
var comment = {}
if (result){
  var attrs =result.attributes
  var author=attrs.author
  comment.articleId = attrs.articleId.id
  comment.count = attrs.count
  comment.id = result.id
  comment.content = attrs.content

  comment.author = author.id
  comment.avatar = author.attributes.avatar
  comment.nickname = author.attributes.nickname
  comment.username = author.attributes.username
  comment.createdAt = result.createdAt.valueOf()
  console.log('comment.time============>',comment.createdAt)

  if(attrs.replyId) {
    var reply = attrs.replyId
    var replyUser = attrs.replyId.attributes.author

    comment.replyusername = replyUser.attributes.username
    comment.replynickname = replyUser.attributes.nickname
    comment.replycontent = reply.attributes.content
  }else{
    comment.replyusername = undefined
    comment.replynickname = undefined
    comment.replycontent = undefined
  }
}
  return comment

}

var articleUtil = {
  commentFromLeancloud: commentFromLeancloud,

}
module.exports = articleUtil


