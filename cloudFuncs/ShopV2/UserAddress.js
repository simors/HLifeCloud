/**
 * Created by lilu on 2017/11/13.
 */
var Promise = require('bluebird')
var AV = require('leanengine')
var constructAddress = require('./shopTools').constructAddress

async function createAddr(req) {
  let {params,currentUser} = req
  if(!currentUser){
    throw new AV.Cloud.Error('don t login',{code: -1})
  }
  let {username,  mobilePhoneNumber, province, city, district, addr, tag } = params
  let Address = AV.Object.extend('Address')
  let address = new Address()
  address.set('username', username)
  address.set('mobilephoneNumber', mobilePhoneNumber)
  address.set('province', province)
  address.set('city', city)
  address.set('district', district)
  address.set('addr', addr)
  address.set('tag', tag)
  try{
    let addressInfo = await address.save()
    return (constructAddress(addressInfo))
  }catch(err){
    throw new AV.Cloud.Error('create fail!',{code: -2})
  }
}


const addrFunc = {
}

module.exports = addrFunc
