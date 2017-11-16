/**
 * Created by lilu on 2017/11/13.
 */
var Promise = require('bluebird')
var AV = require('leanengine')
var constructAddress = require('./shopTools').constructAddress

const addrStatus = {
  DEFAUT_ADDR: 1, // 默认地址
  ENABLE_ADDR: 2, // 可选地址
  DISABLE_ADDR: 0,    // 被删除地址
}

async function createAddr(req,res) {
  let {params,currentUser} = req
  if(!currentUser){
    res.error('don t login')
    return
  }else{
    let {username,  mobilePhoneNumber, province, city, district, addr, tag } = params
    let Address = AV.Object.extend('Address')
    let address = new Address()
    address.set('admin',currentUser)
    address.set('username', username)
    address.set('mobilePhoneNumber', mobilePhoneNumber)
    address.set('province', province)
    address.set('city', city)
    address.set('district', district)
    address.set('addr', addr)
    address.set('tag', tag)
    address.set('status',addrStatus.ENABLE_ADDR)
    try{
      let addressInfo = await address.save()
      res.success(constructAddress(addressInfo))
    }catch(err){
      res.error(err)
    }
  }

}

async function updateAddr(req,res) {
  let {params,currentUser} = req
  if(!currentUser){
    res.error('don t login')
  }
  let {username, mobilePhoneNumber, province, city, district, addr, tag, addrId, status } = params
  let address = AV.Object.createWithoutData('Address', addrId)
  address.set('username', username)
  address.set('mobilePhoneNumber', mobilePhoneNumber)
  address.set('province', province)
  address.set('city', city)
  address.set('district', district)
  address.set('addr', addr)
  address.set('tag', tag)
  address.set('status', status)
  try{
    let addressInfo = await address.save()
    res.success(constructAddress(addressInfo))
  }catch(err){
    res.error(err)
  }
}

/**
 *
 * @param params
 * user: {}
 * lastCreatedAt: str
 * @returns {Array}
 */
async function getAddrsFunc(params){
  let {user, lastCreatedAt} = params
  let query = new AV.Query('Address')
  query.equalTo('admin',user)
  if(lastCreatedAt){
    query.lessThan('createdAt', new Date(lastCreatedAt))
  }
  query.notEqualTo('status', addrStatus.DISABLE_ADDR)
  query.include(['admin'])
  query.descending('createdAt')
  try{
    let addrs = await query.find()
    let addrList = []
    if(addrs && addrs.length>0){
      addrs.forEach((item)=>{
        addrList.push(constructAddress(item,true))
      })
    }
    return addrList
  }catch(err){
    return err
  }
}

async function getAddrs(req,res) {
  let {currentUser,params} = req
  if(!currentUser){
    res.error('don t login')
  }
  let payload = {
    user: currentUser,
    ...params
  }
  try{
    let addrList = await getAddrsFunc(payload)
    res.success(addrList)
  }catch (err){
    res.error(err)
  }
}

async function disableAddr(req,res){
  let {currentUser,params} = req
  if(!currentUser){
    res.error('don t login')
  }
  let {addrId} = params
  let addr = AV.Object.createWithoutData('Address',addrId)
  addr.set('status',addrStatus.DISABLE_ADDR)
  try{
    let addrInfo = await addr.save()
    res.success(constructAddress(addrInfo))
  }catch(err){
    res.error(err)
  }
}


async function setDefaultAddr(req,res){
  let {currentUser,params} = req
  if(!currentUser){
    res.error('don t login')
  }

  let {addrId} = params
  let query = new AV.Query('Address')
  query.equalTo('admin',currentUser)
  query.equalTo('status', addrStatus.DEFAUT_ADDR)
  try{
    let oldDefault = await query.find()
    if(oldDefault&&oldDefault.length>0){
      let oldAddr = AV.Object.createWithoutData('Address', oldDefault[0].id)
      oldAddr.set('status', addrStatus.ENABLE_ADDR)
      await oldAddr.save()
    }
    let addr = AV.Object.createWithoutData('Address', addrId)
    addr.set('status', addrStatus.DEFAUT_ADDR)
    let addrInfo = await addr.save()
    res.success(constructAddress(addrInfo))
  }catch(err){
    res.error(err)
  }

}


async function testAddFunc(req,res){
  return await getAddrs(req,res)
}



const addrFunc = {
  createAddr,
  updateAddr,
  getAddrs,
  testAddFunc,
  disableAddr,
  setDefaultAddr
}

module.exports = addrFunc
