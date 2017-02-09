/**
 * Created by lilu on 2017/1/21.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var articleUtil = require('../../utils/articleUtil')

//添加栏目
function addArticleCategory(request,response){
  var title = request.params.title
  var imageSource = request.params.imageSource
  var type = 'common'
  var ArticleCategory = AV.Object.extend('ArticleCategory')
  var articleCategory = new ArticleCategory()
  articleCategory.set('title',title)
  articleCategory.set('imageSource',imageSource)
  articleCategory.set('type',type)
  articleCategory.save().then((result)=>{
    console.log('result==>',result)
    response.success()
  },(err)=>{
    response.error(err)
  })
}

//管理栏目
function updateCategoryWithoutType(request,response) {
 // console.log('arr',request.params.arr)
  var arr = request.params.arr
  console.log('arr',arr)

  arr.forEach((result)=>{
    console.log('result',result)
    var category = new AV.Object.createWithoutData('ArticleCategory',result.id)
    if(result.imageSource)
      category.set('imageSource',result.imageSource)
    if(result.title)
      category.set('title',result.title)
    category.save()
  })
}


//获取文章的评论列表
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
  query.descending('createdAt')

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
         commentList.sort(arrdes)
       //  console.log('commentList======>',commentList)
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
function arrdes(m,n){
  //console.log('asdasdasd',m.comment.createdAt)
 // console.log('asdasdasd',n.comment.createdAt)

  if(m.comment.createdAt<n.comment.createdAt)
  {return 1}else {
    return -1
  }
}


var ArticleFunc={
  updateCategoryWithoutType:updateCategoryWithoutType,
  getArticleCommentList:getArticleCommentList,
  addArticleCategory:addArticleCategory,
}


module.exports = ArticleFunc