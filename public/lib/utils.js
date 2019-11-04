/*!
 * 基础工具类.
 * 
 * Author: chenming
 * Date: 2019-02-21
 */
define(function(require, exports, module) {
    var utils = {
        /**
         * 模板.
         * 如：
         * var html = '<span><%=data.name%></span>';
         * var data = {data: {id: 1, name: 'test'}} ;
         * sui.utils.tmpl(html, data)  => <span>test</span>
         * 
         */
        tmpl : (c = {}, l = function (e) {
            return 0 == e ? e : (e = (e || "").toString()).replace(/&(?!\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;")
        }, d = function (e, t) {
            if (t)
                for (var n in t) {
                    var i = new RegExp("<%#\\s?" + n + "%>", "g");
                    e = e.replace(i, t[n])
                }
            return e
        }, function e(t, n, i) {
            var a = !/\W/.test(t);
            !a && (t = d(t, i));
            var o = a ? c[t] = c[t] || e(d(document.getElementById(t).innerHTML, i)) : new Function("obj", "_escape", "var _p='';with(obj){_p+='" + t.replace(/[\r\t\n]/g, " ").split("\\'").join("\\\\'").split("'").join("\\'").split("<%").join("\t").replace(/\t-(.*?)%>/g, "'+$1+'").replace(/\t=(.*?)%>/g, "'+_escape($1)+'").split("\t").join("';").split("%>").join("_p+='") + "';} return _p;"),
            r = function (e) {
                return "object" == typeof e && (e.QCCONSOLE_HOST = window.QCCONSOLE_HOST, e.QCMAIN_HOST = window.QCMAIN_HOST, e.QCBUY_HOST = window.QCBUY_HOST),
                o(e, l)
            };
            return n ? r(n) : r
        })
    }

    module.exports = utils
});