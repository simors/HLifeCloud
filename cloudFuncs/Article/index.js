/**
 * Created by lilu on 2017/1/21.
 */
var AV = require('leanengine');

getArticleCommentList(request,response){
var articleId = request.params.articleId
var userId = request.params.userId
var query = new AV.Query('ArticleComment')
  query.equalTo('articleId',articleId)
    query.include(['author'])
    query.include(['replyId'])
  query.include(['replayId.author'])
  query.addAscending('createdAt')
  let commentList=[]
 return query.find().then((results)=>{
    if (result) {
      results.forEach((result)=>{
        if(result)
        var count = getCount(result.id)
        var status = getIsUp(result.id,userId)
          commentList.push({
            comment: result,
            count: count,
            isUp: status
          })
      })
      response.success(commentList)
    }
    else{
      response.error('error')
    }
    })
}

getCount(commentId){
  var query = new AV.Query('Up')
  query.equalTo('targetId',commentId)
  query.equalTo('upType','articleComment')
  query.equalTo('status',true)
  return query.count()
}

getIsUp(commentId,userId){
  var query = new AV.Query('Up')
  query.equalTo('targetId',commentId)
  query.equalTo('upType','articleComment')
  query.equalTo('user',userId)
  return query.find().then((result)=>{
    return result.status
  })
}



var ArticleFunc={
  getArticleCommentList:getArticleCommentList,
}


module.exports = ArticleFunc