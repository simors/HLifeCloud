/**
 * Created by zachary on 2017/1/4.
 */

function parseDate (iso8601) {
  var regexp = new RegExp("^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" + "(.([0-9]+))?" + "Z$");
  var match = regexp.exec(iso8601.toISOString());
  if (!match) {
    return null;
  }
  
  var year = match[1] || 0;
  var month = (match[2] || 1) - 1;
  var day = match[3] || 0;
  var hour = match[4] || 0;
  var minute = match[5] || 0;
  var second = match[6] || 0;
  var milli = match[8] || 0;
  
  return new Date(Date.UTC(year, month, day, hour, minute, second, milli));
}

var util = {
  parseDate: parseDate
}

module.exports = util