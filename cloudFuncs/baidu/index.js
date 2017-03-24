/**
 * Created by wanpeng on 2017/3/22.
 */
var request = require('request');
var pinyin = require("pinyin");

var config = {
  serviceUrl : "http://api.map.baidu.com"
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

function baiduGetSubAreaList(areaCode, cbk) {
  var url = config.serviceUrl + "/shangquan/forward/?qt=sub_area_list&ext=1&level=1&areacode=" + areaCode + "&business_flag=0"
  request(url, function(error, response, body){
    var result = null
    var json = JSON.parse(body)
    if (json && json['result'] && json['result']['error'] == "0") {
      result = json['content']
    }
    if (cbk) {
      cbk(result);
    }
  });
}

function baiduGetSubAreaList2(areaCode, level, cbk) {
  var url = config.serviceUrl + "/shangquan/forward/?qt=sub_area_list&ext=1&level=" + level + "&areacode=" + areaCode + "&business_flag=0"
  request(url, function(error, response, body){
    var result = null
    var json = JSON.parse(body)
    if (json && json['result'] && json['result']['error'] == "0") {
      result = json['content']
    }
    if (cbk) {
      cbk(result);
    }
  });
}

function baiduGetAllCityMap(areaCode, cbk) {
  var url = config.serviceUrl + "/shangquan/forward/?qt=sub_area_list&ext=1&level=2&areacode=" + areaCode + "&business_flag=0"
  request(url, function(error, response, body){
    var country = null
    var allCityList = []
    var cityMap = {}
    var json = JSON.parse(body)
    if (json && json['result'] && json['result']['error'] == "0") {
      country = json['content']
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
  baiduGetSubAreaList(areaCode, function (results) {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  })
}

function getSubAreaList2(request, response) {
  var level = request.params.level || '1'
  var areaCode = request.params.areaCode || '1'
  baiduGetSubAreaList2(areaCode, level, function (results) {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  })
}

function getProviceList(request, response) {
  var areaCode = 1
  baiduGetSubAreaList(areaCode, function (results) {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  })
}

function getCityList(request, response) {
  var provinceCode = request.params.provinceCode
  baiduGetSubAreaList(provinceCode, function (results) {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
  })
}

function getDistrictList(request, response) {
  var cityCode = request.params.cityCode
  baiduGetSubAreaList(cityCode, function (results) {
    if(results && results.sub && results.sub.length) {
      response.success(results.sub)
    }else {
      response.error("get failed!")
    }
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
}

module.exports = baiduFunc