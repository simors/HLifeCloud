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

/*
 *   功能:实现VBScript的DateAdd功能.
 *   参数:interval,字符串表达式，表示要添加的时间间隔.
 *   参数:number,数值表达式，表示要添加的时间间隔的个数.
 *   参数:date,时间对象.
 *   返回:新的时间对象.
 *   var now = new Date();
 *   var newDate = DateAdd( "day", 5, now);
 *---------------   DateAdd(interval,number,date)   -----------------
 */
function DateAdd(interval, number, date) {
  switch (interval) {
    case "year": {
      var m = date.getFullYear();
      date.setFullYear(m + number);
      if(m < date.getFullYear()) {
        date.setDate(0);
      }
      return date;
      break;
    }
    case "q": {
      var d = date.getMonth();
      date.setMonth(d + number * 3);
      if (date.getDate() < d) {
        date.setDate(0);
      }
      return date;
      break;
    }
    case "month": {
      var d = date.getMonth();
      date.setMonth(d + number);
      if (date.getDate() < d) {
        date.setDate(0);
      }
      return date;
      break;
    }
    case "week": {
      date.setDate(date.getDate() + number * 7);
      return date;
      break;
    }
    case "day": {
      date.setDate(date.getDate() + number);
      return date;
      break;
    }
    case "hour": {
      date.setHours(date.getHours() + number);
      return date;
      break;
    }
    case "minute": {
      date.setMinutes(date.getMinutes() + number);
      return date;
      break;
    }
    case "second": {
      date.setSeconds(date.getSeconds() + number);
      return date;
      break;
    }
    default: {
      date.setDate(d.getDate() + number);
      return date;
      break;
    }
  }
}

var util = {
  parseDate: parseDate,
  DateAdd: DateAdd,
}

module.exports = util