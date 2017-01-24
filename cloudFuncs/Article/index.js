/**
 * Created by lilu on 2017/1/21.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var articleUtil = require('../../utils/articleUtil')

function getArticleCommentList(request,response){
var articleId = request.params.articleId
  var article = new AV.Object.createWithoutData('Articles', articleId)
var userId = request.params.userId
 // console.log('userId====>',userId)
 // console.log('articleId====>',articleId)

  var query = new AV.Query('ArticleComment')
  query.equalTo('articleId',article)
    query.include('author')
    query.include('replyId')
  query.include('replyId.author')
  query.addAscending('createdAt')

  query.find().then((results)=>{
   if (results) {
     var commentList=[]
     var promises = []
     if(!request.params.userId){
       results.forEach((comment)=>{
          var articleComment = articleUtil.commentFromLeancloud(comment)
         commentList.push({
           comment:articleComment
         })
       })

       response.success(commentList)
     }
     else {
       results.forEach((comment)=> {
      //   console.log('comment======>',comment)
         var articleComment = articleUtil.commentFromLeancloud(comment)

         if (comment) {
           promises.push(
             getIsUp(comment.id, userId).then((isUp)=> {
               commentList.push({
                 comment: articleComment,
                 // count:count,
                 isUp: isUp
               })
               // console.log('isUp=============', isUp)
             })
           )
         }
       })
       Promise.all(promises).then(()=> {
         console.log('commentList======>',commentList)
         response.success(commentList)
       })
     }
   }
    else{
      response.error('error')
     }
    })

}

function getCount(commentId){
  var query = new AV.Query('Up')
  query.equalTo('targetId',commentId)
  query.equalTo('upType','articleComment')
  query.equalTo('status',true)
    return query.count().then((result)=>{
   // console.log('result===>',result)
    return result
     // console.log('count===>',count)
    })

}

function getIsUp(commentId,userId){
  if(!userId){
    return false
  }else {
    var query = new AV.Query('Up')
    var user = new AV.Object.createWithoutData('_User', userId)
    query.equalTo('targetId', commentId)
    query.equalTo('upType', 'articleComment')
    query.equalTo('user', user)
    return query.first().then((result)=> {

      if (!result) {
        //console.log('result===>', 'false')
        return false
      } else {
        //console.log('result===>', result.attributes.status)
        return result.attributes.status
      }
    })
  }
}



var ArticleFunc={
  getArticleCommentList:getArticleCommentList,
}


module.exports = ArticleFunc