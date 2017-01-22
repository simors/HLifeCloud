/**
 * Created by lilu on 2017/1/21.
 */
var AV = require('leanengine');

function getArticleCommentList(request,response){
var articleId = request.params.articleId
  var article = new AV.Object.createWithoutData('Articles', articleId)
var userId = request.params.userId
 // console.log('userId====>',userId)
 // console.log('articleId====>',articleId)

  var query = new AV.Query('ArticleComment')
  query.equalTo('articleId',article)
    query.include(['author'])
    query.include(['replyId'])
  query.include(['replayId.author'])
  query.addAscending('createdAt')
  let commentList=[]
  let countList = []
  let isUpList = []
  query.find().then((results)=>{
  // console.log('results====>',results)

   if (results) {
      results.forEach((comment)=>{
        if(comment) {
          // var queryCount = new Query('Up')
          // queryCount.equalTo('targetId',comment.id)
          // queryCount.equalTo('upType','articleComment')
          // queryCount.equalTo('status',true)
          // return queryCount.count().then((count)=>{
          //   console.log('count====>',count)
          //   var queryIsUp = new AV.Query(Up)
          //   var user = new AV.Object.createWithoutData('_User', userId)
          //   queryIsUp.equalTo('targetId',comment.id)
          //   queryIsUp.equalTo('upType','articleComment')
          //   queryIsUp.equalTo('user',user)
          //   return queryIsUp.first().then((isUp)=>{
          //     console.log('isUp====>',isUp)
          //   })
          // })

          getCount(comment.id).then((count)=>{
           //  getIsUp(comment.id,userId).then((isUp)=>{
           //    commentList.push({
           //      comment:comment,
           //      count:count,
           //      isUp:isUp
           //    })
           //    console.log('commentList',commentList)
           //    response.success(commentList)
           // })
            commentList.push({
              comment:comment,
              count:count,
             // isUp:isUp
            })
           // console.log('count=============',count)
          })

        }})

      // console.log('commentList',commentList)




    }
    // else{
    //   response.error('error')
    // }
    }).then(()=>{
    response.success(commentList)
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
  var query = new AV.Query('Up')
  var user = new AV.Object.createWithoutData('_User', userId)
  query.equalTo('targetId',commentId)
  query.equalTo('upType','articleComment')
  query.equalTo('user',user)
  return query.first().then((result)=>{
    console.log('result===>',result)
    if(!result){
      return false
    }else {
      return result.attributes.status
    }
  })
}



var ArticleFunc={
  getArticleCommentList:getArticleCommentList,
}


module.exports = ArticleFunc