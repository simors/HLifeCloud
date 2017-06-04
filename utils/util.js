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

/**
 * 获取聊天列表界面时间
 *
 * @param timestamp
 */
function getConversationTime(timestamp) {
  let timeDiffInMS = 0
  if (timestamp) {
    timeDiffInMS = Date.now() - timestamp
  }
  let labelText = "刚刚"
  const timeDiffInSec = Math.floor(timeDiffInMS / 1000.0)
  if (timeDiffInSec > 0) {
    //labelText = timeDiffInSec + "秒前"
    const timeDiffInMin = Math.floor(timeDiffInSec / 60.0)
    if (timeDiffInMin > 0) {
      labelText = timeDiffInMin + "分钟前"
      const timeDiffInHour = Math.floor(timeDiffInMin / 60.0)
      if (timeDiffInHour > 0) {
        labelText = timeDiffInHour + "小时前"
        const timeDiffInDay = Math.floor(timeDiffInHour / 24.0)
        if (timeDiffInDay > 0) {
          labelText = timeDiffInDay + "天前"
          const timeDiffInWeek = Math.floor(timeDiffInDay / 7.0)
          if (timeDiffInWeek > 0) {
            labelText = timeDiffInWeek + "周前"
            const timeDiffInMon = Math.floor(timeDiffInDay / 30.0)
            if (timeDiffInMon > 0) {
              labelText = timeDiffInMon + "月前"
              const timeDiffInYear = Math.floor(timeDiffInDay / 365.0)
              if (timeDiffInYear > 0) {
                labelText = timeDiffInYear + "年前"
              }
            }
          }
        }
      }
    }
  }
  return labelText
}


/**
 * 移除字符中空格
 *
 * @param phone
 */
function removeSpace(phone) {
  if (!phone) {
    return;
  }
  return phone.toString().replace(/\s+/g, "");
}

/**
 * 隐藏电话号码中间4位
 *
 * @param phone
 * @returns {188****8888}
 */
function hidePhoneNumberDetail(phone) {
  if (!phone) {
    return;
  }

  phone = removeSpace(phone)

  if (phone.length <= 7) {
    return phone
  }
  else {
    return phone.toString().substring(0, 3) + "****" + phone.toString().substring(7)
  }
}

var util = {
  parseDate: parseDate,
  DateAdd: DateAdd,
  hidePhoneNumberDetail: hidePhoneNumberDetail,
  getConversationTime: getConversationTime,
}

module.exports = util