/**
 * Created by lilu on 2017/4/8.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
function getAdviseList(request,response){
    var query = new AV.Query('UserFeedBack')
    query.ascending('createdAt')
    query.include('user')
    query.find().then((results)=>{
      var adviseList=[]
      results.forEach((result)=>{
        // console.log('re',result.attributes.user.id,result.attributes.user.attributes.username)
        adviseList.push({
          id: result.id,
          // title: result.attributes.title,
          content: result.attributes.content,
          status:result.attributes.status,
          userName:result.attributes.user.attributes.username,
          userId:result.attributes.user.id,
          // commentNum: result.attributes.commentNum,
          // likeCount: result.attributes.likeCount,
          // status:result.attributes.status,
          // picked: result.attributes.picked,
          // username: result.attributes.user.attributes.nickname,
          // category: result.attributes.category.attributes.title,
          createdAt: result.createdAt
        })
      })
      response.success(adviseList)
    },(err)=>{
      response.error(err)
    })
}

function readAdvise(request,response){
  var advise = AV.Object.createWithoutData('UserFeedBack',request.params.id)
  advise.set('status',1)
  advise.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}
var adviseFuncManager = {
  getAdviseList: getAdviseList,
  readAdvise: readAdvise
}

module.exports = adviseFuncManager
