/**
 * Created by zachary on 2017/1/4.
 */

/**
 * 将leancloud createdAt, updateAt时间对象转换成指定格式的日期字符串
 *
 * format:  YYYY-MM-DD HH:mm:SS
 *   YYYY 年
 *   MM   月
 *   DD   日
 *   HH   时
 *   mm   分
 *   SS   秒
 */
function formatLeancloudTime(lcTime, format) {
  var fullYear = ''
  var month = ''
  var date = ''
  var hours = ''
  var minutes = ''
  var seconds = ''
  format = format || 'YYYY-MM-DD HH:mm:SS'
  if(lcTime) {
    fullYear = lcTime.getFullYear()
    month = lcTime.getMonth() + 1
    month = month < 10 ? '0' + month : month
    date = lcTime.getDate()
    date = date < 10 ? '0' + date : date
    hours = lcTime.getHours()
    hours = hours < 10 ? '0' + hours : hours
    minutes = lcTime.getMinutes()
    minutes = minutes < 10 ? '0' + minutes : minutes
    seconds = lcTime.getSeconds()
    seconds = seconds < 10 ? '0' + seconds : seconds
  }
  var result = format.replace('YYYY', fullYear).replace('MM', month).replace('DD', date)
    .replace('HH', hours).replace('mm', minutes).replace('SS', seconds)
  return result
}

function getConversationTime(timestamp) {
  var timeDiffInMS = 0
  if (timestamp) {
    timeDiffInMS = Date.now() - timestamp
  }
  var labelText = "刚刚"
  var timeDiffInSec = Math.floor(timeDiffInMS / 1000.0)
  if (timeDiffInSec > 0) {
    //labelText = timeDiffInSec + "秒前"
    var timeDiffInMin = Math.floor(timeDiffInSec / 60.0)
    if (timeDiffInMin > 0) {
      labelText = timeDiffInMin + "分钟前"
      var timeDiffInHour = Math.floor(timeDiffInMin / 60.0)
      if (timeDiffInHour > 0) {
        labelText = timeDiffInHour + "小时前"
        var timeDiffInDay = Math.floor(timeDiffInHour / 24.0)
        if (timeDiffInDay > 0) {
          labelText = timeDiffInDay + "天前"
          var timeDiffInWeek = Math.floor(timeDiffInDay / 7.0)
          if (timeDiffInWeek > 0) {
            labelText = timeDiffInWeek + "周前"
            var timeDiffInMon = Math.floor(timeDiffInDay / 30.0)
            if (timeDiffInMon > 0) {
              labelText = timeDiffInMon + "月前"
              var timeDiffInYear = Math.floor(timeDiffInDay / 365.0)
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

var numberUtils = {
  formatLeancloudTime: formatLeancloudTime,
  getConversationTime: getConversationTime
}

module.exports = numberUtils
