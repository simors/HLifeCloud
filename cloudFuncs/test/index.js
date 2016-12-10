/**
 * Created by zachary on 2016/12/10.
 */

var AV = require('leanengine');

function test(request, response) {
  response.success('test 1');
}

var testFunc = {
  test: test,
}

module.exports = testFunc