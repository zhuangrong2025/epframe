/*!
 * 日期工具类.
 * 
 * Author: chenming
 * Date: 2019-02-21
 */
define(function(require, exports, module) {
    var defaultFormat = 'y-m-d';//默认日期格式
    /**
     *判断format格式是否合法
    *@method isLegalFormat
    *@param format 格式字符串
    */
    function isLegalFormat(format) {
        if (!format) {
            return false;
        }
        var y = 0,m = 0,d = 0;
        for (var i = 0; i <= format.length; i++) {
            var tmpC = format.charAt(i);
            if (tmpC == "y") {
                y++;
                continue;
            }
            if (tmpC == "m") {
                m++;
                continue;
            }
            if (tmpC == "d") {
                d++;
                continue;
            }
        }
        return y == 1 && m == 1 && d == 1 ? true: false; //当且仅当y、m、d个数均为1时格式正确
    }
    /**
     *日期格式转为对应正则表达式
     *@method format2Reg
     *@param  format 日期格式
     *@return  json {"reg":reg,"indexArr":indexArr}  reg为对应正则表达式，indexArr为y/m/d在日期格式中位置标记数组
     */
    function format2Reg(format){
        var tmpFormat = format;
        //获取年月日对应的标志
        var y_index = tmpFormat.indexOf("y");
        var m_index = tmpFormat.indexOf("m");
        var d_index = tmpFormat.indexOf("d");
        var tmparrIndex = new Array();
        tmparrIndex[0] = y_index;
        tmparrIndex[1] = m_index;
        tmparrIndex[2] = d_index;
        tmparrIndex.sort();
        var indexArr = new Object();
        for (var i = 0; i <= tmparrIndex.length; i++) {
            if (y_index == tmparrIndex[i]) {
                indexArr.y = i;
            }
            if (m_index == tmparrIndex[i]) {
                indexArr.m = i;
            }
            if (d_index == tmparrIndex[i]) {
                indexArr.d = i;
            }
        }
        tmpFormat = tmpFormat.replace(/d/, "(\\d\\d)").replace(/m/, "(\\d\\d)").replace(/y/, "(\\d{4})");
        tmpFormat = "^".concat(tmpFormat).concat("$");
        var reg = new RegExp(tmpFormat);
        return {"reg":reg,"indexArr":indexArr};
    }
    /**
     *日期字符串转为date类型
    *@method str2date
    *@param t 日期字符串
    *@param format 格式字符串
    */
    function str2date(t, format) {
        if(!t){//日期值为空时，不做处理包含清空日期时
        return ;
        }
        var result = format2Reg(format),
        reg = result.reg,
        arr = reg.exec(t),
        n = new Date(0 / 0);
        n.setFullYear(arr[result.indexArr.y + 1], arr[result.indexArr.m + 1] - 1, arr[result.indexArr.d + 1]);
        return n;
    }
    /**
     *日期字符串转为num类型
    *@method str2num
    *@param t 日期字符串
    *@param format 格式字符串
    */
    function str2num(t,format) {
        return t ? ("string" == typeof t && (t = str2date(t,format)), 1e4 * t.getFullYear() + 100 * (t.getMonth() + 1) + t.getDate()) : 0
    }
    /**
     *date类型转为string
    *@method date2str
    *@param t 日期字符串
    *@param format 格式字符串
    */
    function date2str(d, format) {
        var tmpFormat = format;
        function zeroPadding(v) {
            var str = String(v);
            return 1 === str.length && (str = "0" + str),
            str;
        }
        if ("object" == typeof(d)) {
            tmpFormat = tmpFormat.replace(/y/, d.getFullYear()).replace(/m/, zeroPadding(d.getMonth() + 1)).replace(/d/, zeroPadding(d.getDate()));
        }
        if ("number" == typeof(d)) {
            var num = number2str(d);
            var tmpDate = str2date(num, format);
            tmpFormat = tmpFormat.replace(/y/, tmpDate.getFullYear()).replace(/m/, zeroPadding(tmpDate.getMonth() + 1)).replace(/d/, zeroPadding(tmpDate.getDate()));
        }
        return tmpFormat;
    }
    /**
     *反转
    *@method reverse
    *@param t 
    *@param e
    *@param i
    *Example Usage: reverse({from: 20160521, to: 20160515}) ==> {from: 20160515, to: 20160521}
    */
    function reverse(t, e, i) {
        var n = t[e];
        t[e] = t[i],
        t[i] = n
    }
    /**
     *number类型转为string类型
    *@method number2str
    *@param t number类型的日期
    */
    function number2str(t) {
        if (/^(\d{4})[-\s\.,\/]*(\d\d)[-\s\.,\/]*(\d\d)\s*$/.test(t)) {
            var e = RegExp.$1,
            i = RegExp.$2,
            n = RegExp.$3;
            return [e, i, n].join("-")
        }
        return null
    }
    //判断是否为日期字符串(格式:YYYY-MM-DD)
    //Example Usage:isDateStr('2016-03-22') ==> true, isDateStr('20160322') ==> false
    function isDateStr(str,format) {
        return ! isNaN( + str2date(str,format))
    }
    //addDays  t(date), e(number)
    function addDays(value, interval) {
        return value = new Date(value),
        value.setDate(value.getDate() + interval),
        value
    }
    //计算星期的开始与结束日期
    function getWeekPeriod(date, format) {
        format = format || defaultFormat;
        if(!date) date = new Date();
        var dayOfWeek = date.getDay(), //一周的第几天
            day = date.getDate(), //当前日
            month = date.getMonth(), //当前月
            year = date.getYear(); //当前年
        year += (year < 2000) ? 1900 : 0;
        var startDate = new Date(year, month, day - dayOfWeek),
            endDate = new Date(year, month, day + (6 - dayOfWeek));
        return {
            from: date2str(startDate, format),
            to: date2str(endDate, format)
        }
    }
    //计算月份的开始与结束日期
    function getMonthPeriod(date, format) {
        format = format || defaultFormat;
        if(!date) date = new Date();
        var day = date.getDate(), //当前日
            month = date.getMonth(), //当前月
            year = date.getYear(); //当前年
        year += (year < 2000) ? 1900 : 0;
        var now = new Date();
        var startDate = new Date(year, month, 1),
            nextStartDate = new Date(year, month + 1, 1),
            monthDays = (nextStartDate -startDate)/(1000 * 60 * 60 * 24);
        var endDate = new Date(year, month, month === now.getMonth() ? now.getDate() : monthDays);
        return {
            from: date2str(startDate, format),
            to: date2str(endDate, format)
        }
    }
    //计算季度的开始与结束日期
    function getQuarterPeriod(date, format) {
        format = format || defaultFormat;
        if(!date) date = new Date();
        var day = date.getDate(), //当前日
            month = date.getMonth(), //当前月
            year = date.getYear(); //当前年
        year += (year < 2000) ? 1900 : 0;
        var quarterStartMonth = 0;
        if(month < 3) {
            quarterStartMonth = 0;
        }
        if(2 < month && month < 6) {
            quarterStartMonth = 3;
        }
        if(5 < month && month < 9) {
            quarterStartMonth = 6;
        }
        if(month > 8) {
            quarterStartMonth = 9;
        }
        var quarterEndMonth = quarterStartMonth + 2;
        var startDate = new Date(year, quarterStartMonth, 1),
            nextStartDate = new Date(year, quarterStartMonth + 1, 1),
            monthDays = (nextStartDate -startDate)/(1000 * 60 * 60 * 24);
        endDate = new Date(year, quarterEndMonth, monthDays);
        return {
            from: date2str(startDate, format),
            to: date2str(endDate, format)
        }
    }
    //计算年度的开始与结束日期
    function getYearPeriod(date, format) {
        format = format || defaultFormat;
        if(!date) date = new Date();
        var day = date.getDate(), //当前日
            month = date.getMonth(), //当前月
            year = date.getYear(); //当前年
        year += (year < 2000) ? 1900 : 0;
        var startDate = new Date(year, 0, 1),
            endDate = new Date(year, 11, 31);
        return {
            from: date2str(startDate, format),
            to: date2str(endDate, format)
        }
    }
    var utils = {
        isLegalFormat: isLegalFormat,
        format2Reg: format2Reg,
        str2date: str2date,
        str2num: str2num,
        date2str: date2str,
        reverse: reverse,
        number2str: number2str,
        isDateStr: isDateStr,
        addDays: addDays,
        getWeekPeriod : getWeekPeriod,
        getMonthPeriod : getMonthPeriod,
        getQuarterPeriod : getQuarterPeriod,
        getYearPeriod: getYearPeriod
    };
    module.exports = utils
});