/**
 * Created by lilu on 2017/2/28.
 */
var AV = require('leanengine');
var Promise = require('bluebird');


function getShopCategoryList(request, response) {
  var query = new AV.Query('ShopCategory')
  var categoryList = []
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
  var shopCategoryId = request.params.shopCategoryId
  var sortId = request.params.sortId // 0-智能,1-按好评,2-按距离
  var geoCity = request.params.geoCity
  var isRefresh = request.params.isRefresh

  var skipNum = request.params.isRefresh ? 0 : (request.params.skipNum || 0)
  var shopTagId = request.params.shopTagId
  var query = new AV.Query('Shop')
  //用 include 告知服务端需要返回的关联属性对应的对象的详细信息，而不仅仅是 objectId

  query.include('owner')
  query.include('targetShopCategory')
  query.include('containedTag')

  if (shopCategoryId) {
    //构建内嵌查询
    var innerQuery = new AV.Query('ShopCategory')

    innerQuery.equalTo('shopCategoryId', shopCategoryId)
    //执行内嵌查询
    query.matchesQuery('targetShopCategory', innerQuery)
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
    console.log('count', results.length)
    // console.log('getShopList.results=', results)
    var point = null
    var shopList = []
    results.forEach((result) => {
      console.log('count', result.attributes.containedAnnouncements)
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
      var targetShopCategory={
        text:result.attributes.targetShopCategory.attributes.text,
        id:result.attributes.targetShopCategory.id
      }
      var owner = {
        id : result.attributes.owner.id,
        username:result.attributes.owner.attributes.username
      }
      let shop={
        id:result.objectId,
        shopName:result.attributes.shopName,
        shopAddress:result.attributes.shopAddress,
        isOpen:result.attributes.isOpen,
        coverUrl:result.attributes.coverUrl,
        contactNumber:result.attributes.contactNumber,
        targetShopCategory:targetShopCategory,
        phone:result.attributes.phone,
        geoCity:result.attributes.geoCity,
        name:result.attributes.name,
        openTime:result.attributes.openTime,
        geoDistrict:result.attributes.geoDistrict,
        album:result.attributes.album,
        owner:owner,
        createdAt:result.createdAt
      }

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

var ShopManagerFunc = {
  getShopCategoryList: getShopCategoryList,
  getShopTagList: getShopTagList,
  createShopCategory: createShopCategory,
  updateShopCategory: updateShopCategory,
  createShopTag: createShopTag,
  updateShopTag: updateShopTag,
  getShopList: getShopList,
  updateChoosenCategory: updateChoosenCategory

}
module.exports = ShopManagerFunc
