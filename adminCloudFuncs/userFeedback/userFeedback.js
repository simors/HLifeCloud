/**
 * Created by lilu on 2017/4/8.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
function getAdviseList(request,response){
    var query = new AV.Query('UserFeedBack')
    query.ascending('createdAt')
    query.find().then((results)=>{
      var adviseList=[]
      results.forEach((result)=>{
        adviseList.push({
          id: result.id,
          // title: result.attributes.title,
          content: result.attributes.content,
          status:result.attributes.status,
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

var adviseFuncManager = {
  getAdviseList: getAdviseList,

}

module.exports = adviseFuncManager
