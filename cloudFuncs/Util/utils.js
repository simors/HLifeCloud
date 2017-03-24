/**
 * Created by zachary on 2017/3/24.
 */

var http = require('http');
var querystring = require('querystring');

//http://api.map.baidu.com/shangquan/forward/?qt=sub_area_list&ext=1&level=3&areacode=1&business_flag=0
function getSubAreaList(request, response) {

  var url = 'http://api.map.baidu.com/shangquan/forward/?';

  var queryData = {
    qt: 'sub_area_list',
    ext: '1',
    level: request.params.level || '1',
    areacode: request.params.areacode || '1',
    business_flag: '0',
  };

  var queryParams = querystring.stringify(queryData);

  var options = url + queryParams;
  // console.log('options===*****======', options);

  http.get(options, function(res){

    var body = '';

    res.on('data', function(d) {
      body += d;
    });

    res.on('end', function() {
      var parsed = JSON.parse(body);
      // console.log('end.body===========>>>>>>', body)
      // console.log('end.parsed===========>>>>>>', parsed)
      response.success(parsed.content || {})
    });

  }).on('error', (e) => {
    console.log('getSubAreaList.error--->>>', e);
  });

}

var utilsFunc = {
  getSubAreaList: getSubAreaList
}
module.exports = utilsFunc