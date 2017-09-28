/**
 * Created by yangyang on 2017/9/27.
 */

function constructShop(leanShop, includeOwner, includeInviter) {
  const constructUserInfo = require('../Auth').constructUserInfo

  if (!leanShop) {
    return undefined
  }
  let shop = {}
  let shopAttr = leanShop.attributes
  if (!shopAttr) {
    return undefined
  }
  shop.id = leanShop.id
  shop.name = shopAttr.name
  shop.phone = shopAttr.phone
  shop.shopName = shopAttr.shopName
  shop.shopAddress = shopAttr.shopAddress
  shop.coverUrl = shopAttr.coverUrl
  shop.contactNumber = shopAttr.contactNumber
  shop.contactNumber2 = shopAttr.contactNumber2
  shop.certification = shopAttr.certification
  shop.status = shopAttr.status

  shop.targetShopCategoryId = shopAttr.targetShopCategory ? shopAttr.targetShopCategory : undefined
  shop.targetShopCategory = constructShopCategory(shopAttr.targetShopCategory)

  if (shopAttr.owner) {
    shop.ownerId = shopAttr.owner.id
    if (includeOwner) {
      shop.owner = constructUserInfo(shopAttr.owner)
    }
  }

  if (shopAttr.inviter) {
    shop.inviterId = shopAttr.inviter.id
    if (includeInviter) {
      shop.inviter = constructUserInfo(shopAttr.inviter)
    }
  }

  let containedTag = []
  if (shopAttr.containedTag && shopAttr.containedTag.length) {
    shopAttr.containedTag.forEach((item)=> {
      let tag = constructShopTag(item)
      containedTag.push(tag)
    })
  }
  shop.containedTag = containedTag

  // let containedPromotions = []
  // if (shopAttr.containedPromotions && shopAttr.containedPromotions.length) {
  //   shopAttr.containedPromotions.forEach((promotion)=> {
  //     var promotionRecord = constructPromotion(promotion, false, false)
  //     containedPromotions.push(promotionRecord)
  //   })
  // }
  // shop.containedPromotions = containedPromotions

  if (shopAttr.geo) {
    let geoJson = shopAttr.geo.toJSON()
    shop.geo = [geoJson.latitude, geoJson.longitude]
  }
  shop.geoName = shopAttr.geoName
  shop.geoCity = shopAttr.geoCity
  shop.geoCityCode = shopAttr.geoCityCode
  shop.geoDistrictCode = shopAttr.geoDistrictCode
  shop.geoDistrict = shopAttr.geoDistrict
  shop.geoProvince = shopAttr.geoProvince
  shop.geoProvinceCode = shopAttr.geoProvinceCode
  shop.pv = shopAttr.pv
  shop.score = shopAttr.score
  shop.ourSpecial = shopAttr.ourSpecial
  shop.openTime = shopAttr.openTime
  shop.album = shopAttr.album
  shop.payment = shopAttr.payment
  shop.tenant = shopAttr.tenant
  shop.createdAt = leanShop.createdAt
  shop.updatedAt = leanShop.updatedAt

  return shop
}

function constructShopTag(leanShopTag) {
  if (!leanShopTag) {
    return undefined
  }
  let shopTag = {}
  let shopTagAttr = leanShopTag.attributes
  if (!shopTagAttr) {
    return undefined
  }
  shopTag.id = leanShopTag.id
  shopTag.createdAt = leanShopTag.createdAt
  shopTag.updatedAt = leanShopTag.updatedAt
  shopTag.name = shopTagAttr.name
  shopTag.status = shopTagAttr.status
  if (shopTagAttr.upCategory) {
    shopTag.upCategoryId = shopTagAttr.upCategory.id
  }

  return shopTag
}

function constructShopCategory(leanShopCategory) {
  if (!leanShopCategory) {
    return undefined
  }
  let shopCategory = {}
  let shopCategoryAttr = leanShopCategory.attributes
  if (!shopCategoryAttr) {
    return undefined
  }
  shopCategory.id = leanShopCategory.id
  shopCategory.createdAt = leanShopCategory.createdAt
  shopCategory.updatedAt = leanShopCategory.updatedAt
  shopCategory.imageSource = shopCategoryAttr.imageSource
  shopCategory.shopCategoryId = shopCategoryAttr.shopCategoryId
  shopCategory.status = shopCategoryAttr.status
  shopCategory.text = shopCategoryAttr.text
  shopCategory.displaySort = shopCategoryAttr.displaySort
  shopCategory.textColor = shopCategoryAttr.textColor
  shopCategory.describe = shopCategoryAttr.describe
  shopCategory.showPictureSource = shopCategoryAttr.showPictureSource

  return shopCategory
}

function constructGoods(goods, includeShop, includePromotion) {
  if (!goods) {
    return undefined
  }
  let shopGoods = {}
  let shopGoodsAttr = goods.attributes
  if (!shopGoodsAttr) {
    return undefined
  }
  shopGoods.id = goods.id
  shopGoods.goodsName = shopGoodsAttr.goodsName
  shopGoods.targetShopId = shopGoodsAttr.targetShop.id
  shopGoods.goodsPromotionId = shopGoodsAttr.goodsPromotion ? shopGoodsAttr.goodsPromotion.id : undefined
  shopGoods.price = shopGoodsAttr.price
  shopGoods.originalPrice = shopGoodsAttr.originalPrice
  shopGoods.coverPhoto = shopGoodsAttr.coverPhoto
  shopGoods.album = shopGoodsAttr.album
  shopGoods.detail = shopGoodsAttr.detail
  shopGoods.status = shopGoodsAttr.status
  shopGoods.createdAt = goods.createdAt
  shopGoods.updatedAt = goods.updatedAt

  if (includeShop) {
    shopGoods.targetShop = constructShop(shopGoodsAttr.targetShop, true, false)
  }
  if (includePromotion) {
    shopGoods.goodsPromotion = constructPromotion(shopGoodsAttr.goodsPromotion, false, false)
  }

  return shopGoods
}

function constructPromotion(promotion, includeShop, includeGoods) {
  if (!promotion) {
    return undefined
  }
  let goodsPromotion = {}
  let promotionAttr = promotion.attributes
  if (!promotionAttr) {
    return undefined
  }
  goodsPromotion.id = promotion.id
  goodsPromotion.createdAt = promotion.createdAt
  goodsPromotion.updatedAt = promotion.updatedAt
  goodsPromotion.promotionPrice = promotionAttr.promotionPrice
  goodsPromotion.targetGoodsId = promotionAttr.targetGood ? promotionAttr.targetGood.id : undefined
  goodsPromotion.targetShopId = promotionAttr.targetShop ? promotionAttr.targetShop.id : undefined
  goodsPromotion.startDate = promotionAttr.startDate
  goodsPromotion.endDate = promotionAttr.endDate
  goodsPromotion.abstract = promotionAttr.abstract
  goodsPromotion.status = promotionAttr.status
  goodsPromotion.type = promotionAttr.type
  goodsPromotion.typeId = promotionAttr.typeId
  if (promotionAttr.geo) {
    let geoJson = promotionAttr.geo.toJSON()
    goodsPromotion.geo = [geoJson.latitude, geoJson.longitude]
  }

  if (includeShop) {
    goodsPromotion.targetShop = constructShop(promotionAttr.targetShop, true, false)
  }

  if (includeGoods) {
    goodsPromotion.targetGoods = constructGoods(promotionAttr.targetGood, false, false)
  }

  return goodsPromotion
}

module.exports = {
  constructShop,
  constructGoods,
  constructPromotion,
}