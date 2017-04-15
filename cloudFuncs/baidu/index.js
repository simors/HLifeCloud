/**
 * Created by wanpeng on 2017/3/22.
 */
var Promise = require('bluebird')
var request = require('request');
var pinyin = require("pinyin");

var config = {
  serviceUrl : "http://api.map.baidu.com"
}

function abbrProvince(area) {
  var areaJson = area
  var i = 0
  for (i = 0; i < areaJson.sub.length; i++) {
    var provinceSub = areaJson.sub[i]
    if (provinceSub.area_name.endsWith('省')) {
      areaJson.sub[i].area_name = provinceSub.area_name.substring(0, provinceSub.area_name.lastIndexOf('省'))
    } else if (provinceSub.area_name.endsWith('市')) {
      areaJson.sub[i].area_name = provinceSub.area_name.substring(0, provinceSub.area_name.lastIndexOf('市'))
    } else if (provinceSub.area_name.startsWith('新疆')) {
      areaJson.sub[i].area_name = '新疆'
    } else if (provinceSub.area_name.startsWith('广西')) {
      areaJson.sub[i].area_name = '广西'
    } else if (provinceSub.area_name.startsWith('宁夏')) {
      areaJson.sub[i].area_name = '宁夏'
    } else if (provinceSub.area_name.startsWith('内蒙古')) {
      areaJson.sub[i].area_name = '内蒙古'
    } else if (provinceSub.area_name.startsWith('西藏')) {
      areaJson.sub[i].area_name = '西藏'
    } else if (provinceSub.area_name.startsWith('澳门')) {
      areaJson.sub[i].area_name = '澳门'
    } else if (provinceSub.area_name.startsWith('香港')) {
      areaJson.sub[i].area_name = '香港'
    }
  }
  return areaJson
}

function abbrCity(area) {
  var areaJson = area
  var i = 0
  for (i = 0; i < areaJson.sub.length; i++) {
    var citySub = areaJson.sub[i]
    if (citySub.area_name.endsWith('市')) {
      areaJson.sub[i].area_name = citySub.area_name.substring(0, citySub.area_name.lastIndexOf('市'))
    } else if (citySub.area_name.endsWith('地区')) {
      areaJson.sub[i].area_name = citySub.area_name.substring(0, citySub.area_name.lastIndexOf('地区'))
    } else if (citySub.area_name.startsWith('临夏')) {
      areaJson.sub[i].area_name = '临夏'
    } else if (citySub.area_name.startsWith('甘南')) {
      areaJson.sub[i].area_name = '甘南'
    } else if (citySub.area_name.startsWith('延边')) {
      areaJson.sub[i].area_name = '延边'
    } else if (citySub.area_name.startsWith('海西')) {
      areaJson.sub[i].area_name = '海西'
    } else if (citySub.area_name.startsWith('海北')) {
      areaJson.sub[i].area_name = '海北'
    } else if (citySub.area_name.startsWith('海南')) {
      areaJson.sub[i].area_name = '海南'
    } else if (citySub.area_name.startsWith('黄南')) {
      areaJson.sub[i].area_name = '黄南'
    } else if (citySub.area_name.startsWith('玉树')) {
      areaJson.sub[i].area_name = '玉树'
    } else if (citySub.area_name.startsWith('果洛')) {
      areaJson.sub[i].area_name = '果洛'
    } else if (citySub.area_name.startsWith('克孜勒苏柯尔克孜')) {
      areaJson.sub[i].area_name = '克孜勒'
    } else if (citySub.area_name.startsWith('巴音郭楞')) {
      areaJson.sub[i].area_name = '巴音郭楞'
    } else if (citySub.area_name.startsWith('博尔塔拉')) {
      areaJson.sub[i].area_name = '博尔塔拉'
    } else if (citySub.area_name.startsWith('伊犁')) {
      areaJson.sub[i].area_name = '伊犁'
    } else if (citySub.area_name.startsWith('昌吉')) {
      areaJson.sub[i].area_name = '昌吉'
    } else if (citySub.area_name.startsWith('恩施')) {
      areaJson.sub[i].area_name = '恩施'
    } else if (citySub.area_name.startsWith('神农架')) {
      areaJson.sub[i].area_name = '神农架'
    } else if (citySub.area_name.startsWith('保亭')) {
      areaJson.sub[i].area_name = '保亭'
    } else if (citySub.area_name.startsWith('昌江')) {
      areaJson.sub[i].area_name = '昌江'
    } else if (citySub.area_name.startsWith('陵水')) {
      areaJson.sub[i].area_name = '陵水'
    } else if (citySub.area_name.startsWith('琼中')) {
      areaJson.sub[i].area_name = '琼中'
    } else if (citySub.area_name.startsWith('乐东')) {
      areaJson.sub[i].area_name = '乐东'
    } else if (citySub.area_name.startsWith('白沙')) {
      areaJson.sub[i].area_name = '白沙'
    } else if (citySub.area_name.startsWith('锡林郭勒')) {
      areaJson.sub[i].area_name = '锡林郭勒'
    } else if (citySub.area_name.startsWith('黔南')) {
      areaJson.sub[i].area_name = '黔南'
    } else if (citySub.area_name.startsWith('黔东')) {
      areaJson.sub[i].area_name = '黔东'
    } else if (citySub.area_name.startsWith('黔西')) {
      areaJson.sub[i].area_name = '黔西'
    } else if (citySub.area_name.startsWith('湘西')) {
      areaJson.sub[i].area_name = '湘西'
    } else if (citySub.area_name.startsWith('楚雄')) {
      areaJson.sub[i].area_name = '楚雄'
    } else if (citySub.area_name.startsWith('红河')) {
      areaJson.sub[i].area_name = '红河'
    } else if (citySub.area_name.startsWith('西双版纳')) {
      areaJson.sub[i].area_name = '西双版纳'
    } else if (citySub.area_name.startsWith('大理')) {
      areaJson.sub[i].area_name = '大理'
    } else if (citySub.area_name.startsWith('怒江')) {
      areaJson.sub[i].area_name = '怒江'
    } else if (citySub.area_name.startsWith('迪庆')) {
      areaJson.sub[i].area_name = '迪庆'
    } else if (citySub.area_name.startsWith('德宏')) {
      areaJson.sub[i].area_name = '德宏'
    } else if (citySub.area_name.startsWith('文山')) {
      areaJson.sub[i].area_name = '文山'
    } else if (citySub.area_name.startsWith('甘孜')) {
      areaJson.sub[i].area_name = '甘孜'
    } else if (citySub.area_name.startsWith('凉山')) {
      areaJson.sub[i].area_name = '凉山'
    } else if (citySub.area_name.startsWith('阿坝')) {
      areaJson.sub[i].area_name = '阿坝'
    } else if (citySub.area_name.startsWith('彭水')) {
      areaJson.sub[i].area_name = '彭水'
    } else if (citySub.area_name.startsWith('秀山')) {
      areaJson.sub[i].area_name = '秀山'
    } else if (citySub.area_name.startsWith('酉阳')) {
      areaJson.sub[i].area_name = '酉阳'
    } else if (citySub.area_name.startsWith('石柱')) {
      areaJson.sub[i].area_name = '石柱'
    } else if (citySub.area_name.startsWith('酉阳')) {
      areaJson.sub[i].area_name = '酉阳'
    }
  }
  return areaJson
}

/**
 * 将省市名称简写
 * @param level
 * @param area
 */
function areaAbbr(level, area) {
  var areaJson = area
  var i = 0
  if (level == 1) {
    areaJson = abbrProvince(area)
  } else {
    areaJson = abbrProvince(area)
    for (i = 0; i < areaJson.sub.length; i++) {
      areaJson.sub[i] = abbrCity(areaJson.sub[i])
    }
  }
  return areaJson
}

/**
 * 获取中文名字拼音首字母
 * @param 省份/城市/地区中文名字
 */
function getAleph(area_name) {
  var char = area_name.substr(0, 1)
  if(char) {
    var aleph = pinyin(char, {style: pinyin.STYLE_NORMAL, heteronym: false, segment: false})
    return aleph[0][0]
  }
}

function baiduGetSubAreaList(areaCode) {
  var url = config.serviceUrl + "/shangquan/forward/?qt=sub_area_list&ext=1&level=1&areacode=" + areaCode + "&business_flag=0"

  return new Promise((resolve, reject) => {
    request(url, function(error, response, body){
      var result = null
      var json = JSON.parse(body)
      if (json && json['result'] && json['result']['error'] == "0") {
        result = json['content']
      }
      resolve(areaAbbr(1, result))
    })
  })
}

function baiduGetSubAreaList2(areaCode, level) {
  var url = config.serviceUrl + "/shangquan/forward/?qt=sub_area_list&ext=1&level=" + level + "&areacode=" + areaCode + "&business_flag=0"

  return new Promise((resolve, reject) => {
    request(url, function(error, response, body){
      var result = null
      var json = JSON.parse(body)
      if (json && json['result'] && json['result']['error'] == "0") {
        result = json['content']
      }
      resolve(areaAbbr(level, result))
    })
  })
}

function baiduGetAllCityMap(areaCode, cbk) {
  var url = config.serviceUrl + "/shangquan/forward/?qt=sub_area_list&ext=1&level=2&areacode=" + areaCode + "&business_flag=0"
  request(url, function(error, response, body){
    var country = null
    var allCityList = []
    var cityMap = {}
    var json = JSON.parse(body)
    if (json && json['result'] && json['result']['error'] == "0") {
      country = areaAbbr(2, json['content'])
      var provinceList = country['sub']
      provinceList.forEach((province) => {
        if(province['area_type'] == 2) {
          delete province.geo
          delete province.sub
          province.aleph = getAleph(province['area_name'])
          allCityList.push(province)
        }
        if(province['area_type'] == 1) {
          var cityList = province['sub']
          cityList.forEach((city) => {
            if(city['area_type'] == 2) {
              delete city.geo
              city.aleph = getAleph(city['area_name'])
              allCityList.push(city)
            }
          })
        }
      })
    }
    if(allCityList && allCityList.length > 0) {
      allCityList = allCityList.sort(function (x, y) {
        return x.aleph.localeCompare(y.aleph)
      })
      allCityList.forEach((city) => {
        if(city.aleph[0].toUpperCase() in cityMap) {
          cityMap[city.aleph[0].toUpperCase()].push(city)
        } else {
          cityMap[city.aleph[0].toUpperCase()] = []
          cityMap[city.aleph[0].toUpperCase()].push(city)
        }
      })
    }
    if (cbk) {
      cbk(cityMap);
    }
  });
}

function getSubAreaList(request, response) {
  var areaCode = request.params.areaCode

  baiduGetSubAreaList(areaCode).then((results) => {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  }).catch((error) => {
    response.error("get failed!")
  })
}

function getSubAreaList2(request, response) {
  var level = request.params.level || '1'
  var areaCode = request.params.areaCode || '1'

  baiduGetSubAreaList2(areaCode, level).then((results) => {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  }).catch((error) => {
    response.error("get failed!")
  })
}

function getProviceList(request, response) {
  var areaCode = 1

  baiduGetSubAreaList(areaCode).then((results) => {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  }).catch((error) => {
    response.error("get failed!")
  })
}

function getCityList(request, response) {
  var provinceCode = request.params.provinceCode

  baiduGetSubAreaList(provinceCode).then((results) => {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  }).catch((error) => {
    response.error("get failed!")
  })
}

/**
 * getSubAreaByAreaName
 * 通过省份/城市名称获取下属区域（城市/区／县）
 * @param areaName
 * @param areaType: province|city
 * @returns {Promise.<T>}
 */
function getSubAreaByAreaName(areaName, areaType) {

  if(areaType == 'province') {
    return baiduGetSubAreaList(1).then((results) => {
      if(results && results.sub && results.sub.length) {
        var provinceList = results.sub
        var index = provinceList.findIndex(function (value) {
          return value.area_name == areaName
        })
        if(index == -1) {
          console.log("get failed!")
          throw {message: "get failed!"}
        } else {
          return provinceList[index].area_code
        }
      }else {
        console.log("get province areaInfo failed!")
        throw {message: "get province areaInfo failed!"}
      }
    }).then((area_code) => {
      return baiduGetSubAreaList(area_code)
    }).then((cityResults) => {
      if(cityResults && cityResults.sub && cityResults.sub.length) {
        return cityResults.sub
      }else {
        console.log("get failed!")
        throw {message: "get failed!"}
      }
    }).catch((error) => {
      return new Promise((resolve, reject) => {
        reject(error)
      })
    })
  } else if(areaType == 'city') {
    return baiduGetSubAreaList2(1, 2).then((results) => {
      if(results && results.sub && results.sub.length) {
        var provinceList = results.sub
        var area_code = undefined
         provinceList.forEach((value) => {
          cityList = value.sub
          var index = cityList.findIndex(function (value) {
            return value.area_name == areaName
          })
          if(index != -1) {
            area_code =  cityList[index].area_code
            return
          }
        })
        return area_code
      }else {
        console.log("get city info failed!")
        throw {message: "get city info failed!"}
      }
    }).then((area_code) => {
      return baiduGetSubAreaList(area_code)
    }).then((areaResults) => {
      if (areaResults && areaResults.sub && areaResults.sub.length) {
        return areaResults.sub
      } else {
        throw {message: 'get city sub areaInfo failed!'}
      }
    }).catch((error) => {
      return new Promise((resolve, reject) => {
        reject(error)
      })
    })
  } else {
    console.log("unknow areaType!")
    return new Promise((resolve, reject) => {
      reject({message: "unknow areaType!"})
    })
  }
}

function getDistrictList(request, response) {
  var cityCode = request.params.cityCode

  baiduGetSubAreaList(cityCode).then(() => {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  }).catch((error) => {
    response.error("get failed!")
  })
}

function getAllCityMap(request, response) {
  var areaCode = request.params.areaCode
  baiduGetAllCityMap(areaCode, function (results) {
    if(results) {
      response.success(results)
    }else {
      response.error("get failed!")
    }
  })
}

var baiduFunc = {
  getProviceList: getProviceList,
  getCityList: getCityList,
  getDistrictList: getDistrictList,
  getSubAreaList: getSubAreaList,
  getSubAreaList2: getSubAreaList2,
  getAllCityMap: getAllCityMap,
  getSubAreaByAreaName: getSubAreaByAreaName,
}

module.exports = baiduFunc