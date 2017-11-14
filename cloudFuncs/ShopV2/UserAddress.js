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

async function createAddr(req) {
  let {params,currentUser} = req
  if(!currentUser){
    throw new AV.Cloud.Error('don t login',{code: -1})
  }
  let {username,  mobilePhoneNumber, province, city, district, addr, tag } = params
  let Address = AV.Object.extend('Address')
  let address = new Address()
  address.set('admin',currentUser)
  address.set('username', username)
  address.set('mobilephoneNumber', mobilePhoneNumber)
  address.set('province', province)
  address.set('city', city)
  address.set('district', district)
  address.set('addr', addr)
  address.set('tag', tag)
  address.set('status',addrStatus.ENABLE_ADDR)
  try{
    let addressInfo = await address.save()
    return (constructAddress(addressInfo))
  }catch(err){
    throw new AV.Cloud.Error('create fail!',{code: -2})
  }
}

async function updateAddr(req) {
  let {params,currentUser} = req
  if(!currentUser){
    throw new AV.Cloud.Error('don t login',{code: -1})
  }
  let {username, mobilePhoneNumber, province, city, district, addr, tag, addrId, status } = params
  let address = AV.Object.createWithoutData('Address', addrId)
  address.set('username', username)
  address.set('mobilephoneNumber', mobilePhoneNumber)
  address.set('province', province)
  address.set('city', city)
  address.set('district', district)
  address.set('addr', addr)
  address.set('tag', tag)
  address.set('status', status)
  try{
    let addressInfo = await address.save()
    return (constructAddress(addressInfo))
  }catch(err){
    throw new AV.Cloud.Error('update fail!',{code: -3})
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
  query.include(['admin'])
  query.descending('createdAt')
  try{
    let addrs = await query.find()
    let addrList = []
    if(addrs && addrs.length>0){
      addrs.forEach((item)=>{
        addrList.push(item,true)
      })
    }
    return addrList
  }catch(err){
    throw new AV.Cloud.Error('fetch fail!',{code: -4})
  }
}

async function getAddrs(req) {
  let {currentUser,params} = req
  if(!currentUser){
    throw new AV.Cloud.Error('don t login',{code: -1})
  }
  let payload = {
    user: currentUser,
    ...params
  }
  try{
    let addrList = await getAddrsFunc(payload)
    return addrList
  }catch (err){
    throw new AV.Cloud.Error('fetch fail!',{code: -4})
  }
}

async function disableAddr(req){
  let {currentUser,params} = req
  if(!currentUser){
    throw new AV.Cloud.Error('don t login',{code: -1})
  }
  let {addrId} = params
  let addr = AV.Object.createWithoutDate('Address',addrId)
  addr.set('status',addrStatus.DISABLE_ADDR)
  try{
    return true
  }catch(err){
    throw new AV.Cloud.Error('disable fail',{code: -5})
  }
}


async function setDefaultAddr(req){
  let {currentUser,params} = req
  if(!currentUser){
    throw new AV.Cloud.Error('don t login',{code: -1})
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
    return constructAddress(addrInfo)
  }catch(err){
    throw new AV.Cloud.Error('set default fail',{code: -6})
  }

}


async function testAddFunc(req){
  return await getAddrs(req)
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
