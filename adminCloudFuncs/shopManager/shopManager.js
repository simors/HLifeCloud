/**
 * Created by lilu on 2017/2/28.
 */
var AV = require('leanengine');
var Promise = require('bluebird');
var shopUtil = require('../../utils/shopUtil');

function updateCategoryStatus(request,response){
  var category = AV.Object.createWithoutData('ShopCategory', request.params.id)
  category.set('status',request.params.status)
  category.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}
function getShopCategoryList(request, response) {
  var categoryStatus = request.params.status
  var query = new AV.Query('ShopCategory')
  var categoryList = []
  if(categoryStatus==1){
    query.equalTo('status',categoryStatus)
  }
  query.include('containedTag')
  query.ascending('shopCategoryId')
  query.find().then((results)=> {
    results.forEach((result)=> {
      var tags = []
      // console.log('containedTag', result.attributes.containedTag)
      if (result.attributes.containedTag) {
        result.attributes.containedTag.forEach((tag)=> {
          var tagInfo = {
            id: tag.id,
            name: tag.attributes.name
          }
          tags.push(tagInfo)
        })
      }

      var category = {
        id: result.id,
        imageSource: result.attributes.imageSource,
        shopCategoryId: result.attributes.shopCategoryId,
        containedTag: tags,
        status: result.attributes.status,
        text: result.attributes.text,
        displaySort: result.attributes.displaySort,
        describe: result.attributes.describe,
        showPictureSource: result.attributes.showPictureSource,
        textColor: result.attributes.textColor
      }
      categoryList.push(category)
    })

  }, (err)=> {
    response.error(err)
  }).then(()=> {
    response.success(categoryList)
  }, (err)=> {
    response.error(err)
  })
}

function getShopTagList(request, response) {
  var query = new AV.Query('ShopTag')
  var tagList = []
  query.find().then((results)=> {
    results.forEach((result)=> {
      tagList.push({
        id: result.id,
        name: result.attributes.name
      })
    })
    response.success(tagList)

  }, (err)=> {
    response.error(err)
  })
}

function createShopCategory(request, response) {
  var query = new AV.Query('ShopCategory')
  query.count().then((count)=> {
    var Category = AV.Object.extend('ShopCategory')
    var category = new Category()
    category.set('imageSource', request.params.imageSource)
    category.set('status', request.params.status)
    category.set('containedTag', request.params.tagList)
    category.set('text', request.params.text)
    category.set('displaySort', request.params.displaySort)
    category.set('describe', request.params.describe)
    category.set('showPictureSource', request.params.showPictureSource)
    category.set('textColor', request.params.textColor)
    category.set('shopCategoryId', count + 1)
    category.save().then(()=> {
      response.success()
    }, (err)=> {
      response.error(err)
    })
  })
}

function updateShopCategory(request, response) {
  var category = AV.Object.createWithoutData('ShopCategory', request.params.id)

  category.set('imageSource', request.params.imageSource)
  category.set('status', request.params.status)
  category.set('containedTag', request.params.tagList)
  category.set('text', request.params.text)
  category.set('displaySort', request.params.displaySort)
  category.set('describe', request.params.describe)
  category.set('showPictureSource', request.params.showPictureSource)
  category.set('textColor', request.params.textColor)
  category.save().then(()=> {
    response.success()
  }, (err)=> {
    response.error(err)
  })
}
function createShopTag(request, response) {
  var Tag = AV.Object.extend('ShopTag')
  var tag = new Tag()
  tag.set('name', request.params.name)
  tag.save().then(()=> {
      response.success()
    }, (err)=> {
      response.error(err)
    }
  )
}
function updateShopTag(request, response) {
  var category = AV.Object.createWithoutData('ShopTag', request.params.key)
  category.set('name', request.params.name)
  category.save().then(()=> {
    response.success()
  }, (err)=> {
    response.error(err)
  })
}

function getShopList(request, response) {
  var orderMode = request.params.orderMode
  var shopCategoryName = request.params.shopCategoryName
  var sortId = request.params.sortId // 0-智能,1-按好评,2-按距离
  var geoCity = request.params.geoCity
  var isRefresh = request.params.isRefresh
  var username = request.params.username
  var isOpen = request.params.isOpen

  var skipNum = request.params.isRefresh ? 0 : (request.params.skipNum || 0)
  var shopTagId = request.params.shopTagId
  var query = new AV.Query('Shop')
  //用 include 告知服务端需要返回的关联属性对应的对象的详细信息，而不仅仅是 objectId

  query.include('owner')
  query.include('targetShopCategory')
  query.include('containedTag')

  // if(isOpen){
  //   query.equalTo('isOpen',isOpen)
  // }

  if (orderMode == 'createTimeDescend') {
    query.descending('createdAt');
  }
  else if (orderMode == 'createTimeAscend') {
    query.ascending('createdAt');
  }
  else if (orderMode == 'likeCountDescend') {
    query.descending('likeCount');
  }
  else if (orderMode == 'commentNumDescend') {
    query.descending('commentNum');
  }
  else {
    query.descending('createdAt');
  }

  if (!request.params.startTime) {
    query.greaterThanOrEqualTo('createdAt', new Date('2016-11-28 00:00:00'));
    query.lessThan('createdAt', new Date());
  }
  else {
    query.greaterThanOrEqualTo('createdAt', request.params.startTime);
    query.lessThan('createdAt', request.params.endTime);
  }

  if (shopCategoryName) {
    //构建内嵌查询
    var innerQuery = new AV.Query('ShopCategory')

    innerQuery.contains('text', shopCategoryName)
    //执行内嵌查询
    query.matchesQuery('targetShopCategory', innerQuery)
  }
  if (username) {
    //构建内嵌查询
    var innerQuery = new AV.Query('_User')

    innerQuery.contains('username', username)
    //执行内嵌查询
    query.matchesQuery('owner', innerQuery)
  }

  if (sortId == 1) {
    if (!isRefresh) { //分页查询
      query.skip(skipNum)
      // query.lessThanOrEqualTo('score', lastScore)
    }
    query.addDescending('score')
  } else if (sortId == 2) {
    if (!isRefresh) { //分页查询
      query.skip(skipNum)
      // query.lessThanOrEqualTo('geo', lastGeo)
    }
  } else {
    if (!isRefresh) { //分页查询
      query.skip(skipNum)
      // query.lessThanOrEqualTo('score', lastScore)
    }
    query.addDescending('score')
    // query.addDescending('geo')
  }
  //query.limit(5) // 最多返回 5 条结果

  // console.log('getShopList.geoCity===', geoCity)
  // console.log('getShopList.typeof geoCity===', typeof geoCity)
  if (geoCity) {
    query.contains('geoCity', geoCity)
  }


  if (shopTagId) {
    var shopTag = AV.Object.createWithoutData('ShopTag', shopTagId)
    query.equalTo('containedTag', shopTag)
  }
  // console.log('getShopList.query===', query)
  query.find().then(function (results) {
    // console.log('count', results.length)
    // console.log('getShopList.results=', results)
    var point = null
    var shopList = []
    results.forEach((result) => {
       // console.log('count', result.attributes.containedTag)
      var tags = []
      // console.log('containedTag', result.attributes.containedTag)
      if (result.attributes.containedTag) {
        result.attributes.containedTag.forEach((tag)=> {
          var tagInfo = {
            id: tag.id,
            name: tag.attributes.name
          }
          tags.push(tagInfo)
        })
      }
      var targetShopCategory={}
      if (result.attributes.targetShopCategory){
        targetShopCategory ={
          text:result.attributes.targetShopCategory.attributes.text,
          id:result.attributes.targetShopCategory.id
        }
      }

      var owner = {
        id : result.attributes.owner.id,
        username:result.attributes.owner.attributes.username
      }
      // console.log('result',result)
      var shop={
        id:result.id,
        shopName:result.attributes.shopName,
        shopAddress:result.attributes.shopAddress,
        isOpen:result.attributes.isOpen,
        coverUrl:result.attributes.coverUrl,
        contactNumber:result.attributes.contactNumber,
        targetShopCategory:targetShopCategory,
        containedTag:tags,
        score:result.attributes.score,
        pv:result.attributes.pv,
        phone:result.attributes.phone,
        geoCity:result.attributes.geoCity,
        name:result.attributes.name,
        openTime:result.attributes.openTime,
        geoDistrict:result.attributes.geoDistrict,
        album:result.attributes.album,
        owner:owner,
        grade:result.attributes.grade,
        createdAt:result.createdAt
      }
      // console.log('hahahah',shop)
      // result.nextSkipNum = parseInt(skipNum) + results.length
      shopList.push(shop)
    })
    response.success(shopList)
  }, function (err) {
    response.error(err)
  })
}

function updateChoosenCategory(request, response) {
  var query = new AV.Query('ShopCategory')
  query.notEqualTo('displaySort', null)
  query.find().then((results)=> {
    var categoryCancelList = []
    results.forEach((result)=> {
      var category = AV.Object.createWithoutData('ShopCategory', result.id)
      category.set('displaySort', null)
      categoryCancelList.push(category)
    })
    AV.Object.saveAll(categoryCancelList).then(()=> {
      var categorys = []
      var count = 1
      request.params.choosenCategory.forEach((result)=> {
        var category = AV.Object.createWithoutData('ShopCategory', result.id)
        category.set('displaySort', count)
        categorys.push(category)
        count++
      })
      AV.Object.saveAll(categorys)
    }).then(()=> {
      response.success()
    }, (err)=> {
      response.error(err)
    })
  })

}

function closeShop(request,response){
  var shop = AV.Object.createWithoutData('Shop',request.params.id)
  shop.set('isOpen',false)
  shop.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}

function openShop(request,response){
  var shop = AV.Object.createWithoutData('Shop',request.params.id)
  shop.set('isOpen',true)
  shop.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}

function getAnnouncementsByShopId(request,response){
  var shop = AV.Object.createWithoutData('Shop',request.params.id)
  var relation = shop.relation('containedAnnouncements');
  var query = relation.query()
  query.find().then((results)=>{
    var announcements=[]
    results.forEach((result)=>{
      var announcement={
        id:result.id,
        coverUrl:result.attributes.coverUrl,
        content:result.attributes.content,
      }
      announcements.push(announcement)
    })
    response.success(announcements)
  },(err)=>{
    response.error(err)
  })
}
function AdminShopCommentList(request, response) {
  var shopId = request.params.id
  var isRefresh = request.params.isRefresh
  var lastCreatedAt = request.params.lastCreatedAt

  var query = new AV.Query('ShopComment')



  //构建内嵌查询
  var innerQuery = new AV.Query('Shop')
  if(shopId){
    innerQuery.equalTo('objectId', shopId)
  }
  //
  //执行内嵌查询
  query.matchesQuery('targetShop', innerQuery)

  query.include(['targetShop', 'user'])

  query.addDescending('createdAt')
  return query.find().then(function(results) {
    // console.log('shopComments==', results)
    try{
      var shopComments = shopUtil.shopCommentFromLeancloudObject(results)

      if(shopComments && shopComments.length) {
        var queryArr = []
        var upQueryArr = []
        shopComments.forEach(function(item, index){
          var replyQuery = new AV.Query('ShopCommentReply')
          var shopComment = AV.Object.createWithoutData('ShopComment', item.id)
          replyQuery.equalTo('replyShopComment', shopComment)
          queryArr.push(replyQuery)

          var upQuery = new AV.Query('ShopCommentUp')
          upQuery.equalTo('targetShopComment', shopComment)
          upQueryArr.push(upQuery)
        })

        var orQuery = AV.Query.or.apply(null, queryArr)
        orQuery.include(['user', 'parentReply', 'parentReply.user'])
        orQuery.addAscending('createdAt')

        return orQuery.find().then(function(orResults){
          var replys = shopUtil.shopCommentReplyFromLeancloudObject(orResults)
          shopUtil.shopCommentsConcatReplys(shopComments, replys)

          var upOrQuery = AV.Query.or.apply(null, upQueryArr)
          upOrQuery.include(['user'])
          upOrQuery.addAscending('createdAt')
          // console.log('orResults==========', orResults)

          return upOrQuery.find().then(function(upOrResults) {
            try{
              // console.log('upOrResults==========', upOrResults)
              var ups = shopUtil.shopCommentUpFromLeancloudObject(upOrResults)
              // console.log('shopCommentUpFromLeancloudObject==========')
              shopUtil.shopCommentsConcatUps(shopComments, ups)
              // console.log('shopCommentsConcatUps==========')
              response.success(shopComments)
            }catch(err) {
              console.log('err==========', err)
            }
          }, function(upErr) {
            response.success(shopComments)
          })

        }, function(err) {
          response.success(shopComments)
        })
      }
      response.success(shopComments)
    }catch(err) {
      response.error(err)
    }
  }, function(err) {
    response.error(err)
  })
}

function enableShopComment(request,response){
  var shop = AV.Object.createWithoutData('ShopComment',request.params.id)
  shop.set('enable',true)
  shop.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}

function disableShopComment(request,response){
  var shop = AV.Object.createWithoutData('ShopComment',request.params.id)
  shop.set('enable',false)
  shop.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}
function deleteShopCoverImg(request,response){
  var shop = AV.Object.createWithoutData('Shop',request.params.id)
  shop.set('coverUrl',null)
  shop.save().then(()=>{
    response.success()
  },(err)=>{
    response.error(err)
  })
}
var ShopManagerFunc = {
  getShopCategoryList: getShopCategoryList,
  getShopTagList: getShopTagList,
  createShopCategory: createShopCategory,
  updateShopCategory: updateShopCategory,
  createShopTag: createShopTag,
  updateShopTag: updateShopTag,
  getShopList: getShopList,
  updateChoosenCategory: updateChoosenCategory,
  closeShop:closeShop,
  openShop:openShop,
  getAnnouncementsByShopId:getAnnouncementsByShopId,
  AdminShopCommentList:AdminShopCommentList,
  disableShopComment:disableShopComment,
  enableShopComment:enableShopComment,
  deleteShopCoverImg:deleteShopCoverImg,
  updateCategoryStatus:updateCategoryStatus

}
module.exports = ShopManagerFunc
