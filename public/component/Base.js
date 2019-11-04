/**
 * 步骤组件应用层封装.
 */
define(function(require, exports, module) {
    /** 
     *  组件基类.
     */
    var $ = require('jquery');
    
    var utils = {
        extend: function () {
            // inline overrides
            var io = function (o) {
                for (var m in o) {
                    this[m] = o[m];
                }
            };
            var oc = Object.prototype.constructor;

            return function (sb, sp, overrides) {
                if (typeof sp === 'object') {
                    overrides = sp;
                    sp = sb;
                    sb = overrides.constructor !== oc ? overrides.constructor : function () { sp.apply(this, arguments); };
                }
                var F = function () { },
                    sbp,
                    spp = sp.prototype;

                F.prototype = spp;
                sbp = sb.prototype = new F();
                sbp.constructor = sb;
                sb.superclass = spp;
                if (spp.constructor === oc) {
                    spp.constructor = sp;
                }
                sbp.superclass = sbp.supr = (function () {
                    return spp;
                });
                sbp.override = io;
                utils.override(sb, overrides);
                sb.extend = function (o) { return utils.extend(sb, o); };
                return sb;
            };
        }(),
        override: function (origclass, overrides) {
            if (overrides) {
                var p = origclass.prototype;
                $.extend(p, overrides);
            }
        }
    }
    //bind方法兼容
    if (!Function.prototype.bind) { 
        Function.prototype.bind = function (oThis) {
            if (typeof this !== 'function') {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                Fnop = function () { },
                fBound = function () {
                    return fToBind.apply(this instanceof Fnop && oThis ? this : oThis,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            Fnop.prototype = this.prototype;
            fBound.prototype = new Fnop();

            return fBound;
        };
    }

    var noop = function () { };
    /*
    * 组件基类.
    */
    var Base = utils.extend(noop, {
        constructor: function (options) {
            
        },
        //事件绑定
        on: function (ename, handler, scope) {
            var ctx = scope || this;
            ctx._handlers = ctx._handlers || {};
            ctx._handlers[ename] = {
                handler: handler,
                context: scope,
                ctx: ctx
            }
        },
        //事件只绑定一次
        one: function (ename, handler, scope) {
            return handler && (handler.one = !0),
                this.on(ename, handler, scope)
        },
        //解除事件绑定
        off: function (ename, handler, scope) {
            var ctx = scope || this,
                r = ctx._handlers;
            if (ename && r[ename]) {
                if ('function' === typeof handler && r[ename].handler === handler) {
                    r[ename] = {};
                }
            } else {
                r[ename] = {}
            }
        },
        //触发事件
        emit: function (ename) {
            var args = [].slice.call(arguments, 1), ret = true,
                i = this._handlers && this._handlers[ename];
            if (i && i.handler) {
                ret = i.handler.apply(this, args) === false ? false : true;
                if (i.handler.one) { i = {} }
            }
            return ret
        }
    });

    module.exports = Base;
});