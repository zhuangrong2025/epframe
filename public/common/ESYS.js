/*!
 * 系统管理模块公用基础模块封装.
 * 
 * Author: chenming
 * Date: 2019-01-16
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        baseCommon = require('base-common-module'),
        Base = require('../component/Base'),
        ESYSCmp = require('./esys-component'),
        observer = require('observer'),
        storage = require('xyz-storage');

    require('./esys-base.css');


    var ESYS = {};
    /**
     * 模块引用. 
     * 按需加载.
     */
    var cachedModules = {};//模块缓存
    /*
     * 模块统一入口定义, 对外的模块名要求命名简单.
     * ESYS开头的表示ESYS内置的统一标准组件.
     */ 
    var ms = {
        //datatable : '../component/DataTable',
        datatable : 'ESYSTable',
        alert : 'xyz-alert',
        tab : 'ESYSTab', 
        dialog: '../component/dialog/Dialog',
        datalist: '../datalist/DataList',
        daterangepicker: 'ESYSDateRangePicker',

        deptree: '../deptree/DepTree',
        deptreepanel: '../deptreepanel/DepTreePanel',
        transfer: '../transfer/Transfer',
        rolerightselect: '../rolerightselect/RoleRightSelect',
        step: '../step/Step',
        userselect: '../userselect/UserSelect',
        menuselect: '../menuselect/MenuSelect',
        userrightview: '../userrightview/UserRightView',
        swiperlite: '../component/swiperLite/SwiperLite'
    };

    /*
    *   获取项目名称
    */
    var pathName = window.document.location.pathname;
    var projectName = pathName.substring(1,pathName.substr(1).indexOf('/')+1);

    /**
     * 组件代理.
     */
    var ComponentProxy = (function() {
        var invokeQueue = {};//组件调用队列
        //模块临时代理函数, 用于将模块的调用参数加载到队列中,待模块加载完成自动从队列中获取参数并调用.
        var ProxyFunction = function(name) {
            return function(options) {
                if(!invokeQueue[name] || !invokeQueue[name].length) {//新增组件的调用队列
                    invokeQueue[name] = [];
                }
                invokeQueue[name].push({proxy: this, options:options});
                this.render = function(){};//空渲染
            }
        }
        //调用队列中的实例
        function invokeQueueModule(name, module) {
            //调用队列中有该组件的调用实例,取出调用
            if(invokeQueue[name] && invokeQueue[name].length) {
                var props = module.prototype;
                _.each(invokeQueue[name], function(item) {
                    var inst = new module(item.options);
                    inst.render();
                    applyInstMethods(item.proxy, inst, props);
                });
                invokeQueue[name] = [];//执行完清空队列
            }
        }
        //代理组件实现组件实例的方法
        function applyInstMethods(proxy, inst, props) {
            var ignoreFunc = ['constructor', 'initialize'];
            _.each(props, function(prop, propName) {
                if(_.isFunction(prop) && !_.startsWith(propName, "_") && !_.includes(ignoreFunc, propName)) {//公共用方法
                    proxy[propName] = inst[propName].bind(inst);
                }   
            });
        }
        return {
            //创建组件代理
            createProxy: function(name) {
                return new ProxyFunction(name);
            },
            //模块化组件按队列中的初始化参数实例化
            queueFn: invokeQueueModule
        }
    })();

    

    _.assign(ESYS, {
        /**
         * 模块引用, 在ESYS中定义的模块才允许引用.
         * 支持三种方式引用：
         * 1. 引用单个模块  require('dialog')
         * 2. 数组方式引用多个模块 require(['dialog', 'alert'])
         * 3. 多参数方式引用多个模块 require('dialog', 'alert')
         */
        require : function(modules, scope) {
            //多参数方式引用模块
            if(arguments.length > 1 && _.isString(modules)) {
                var arr = [];
                _.each(arguments, function(arg) {
                    arr.push(arg);
                });
                modules = arr;
            }
            var keys = [], moduleObj;
            if(_.isString(modules)) {//只引用单个模块的情况
                keys.push(modules);
            } else if(_.isArray(modules)) {//数组方式引用多个模块
                keys = modules; 
            }
            _.each(keys, function(key) {
                if(!ms[key]) {//在ESYS中定义的模块才允许引用
                    return;
                }
                if(!cachedModules[key]) {//已存在的模块不重新引用
                    if(_.startsWith(ms[key], 'ESYS')) {//内置组件
                        ESYS[key] = ESYSCmp[ms[key]];
                    } else {//模块化组件
                        ESYS[key] = ComponentProxy.createProxy(key);//创建组件代理
                        require.async(ms[key], function(module) {
                            ESYS[key] = module;
                            cachedModules[key] = module; //已加载的保存到缓存中
                            ComponentProxy.queueFn(key, module);
                        });
                    }
                }
            }, this);
        },
        /**
         * 注册统一对外组件.
         * 参数说明: 
         * key: String  对外组件名
         * cmpName: String  内部组件名或模块化组件名
         * 如: register('tab', 'ESYSTab')
         * TODO: 当前ESYS.register()只能放在ESYS.require()之前使用
         */
        register: function(key, cmpName) {
            var items = [];
            if(arguments.length == 1 && _.isArray(arguments[0])) {
                items = arguments[0];
            } else {
                items = [{name: key, component: cmpName}];
            }
            _.each(items, function(item) {
                ms[item.name] = item.component;
                if(cachedModules[item.name]) {//已加载该模块，清空缓存的模块对象
                    cachedModules[item.name] = null;
                    delete ESYS[item.name];
                    ESYS.require(item.name);
                }
            });
        }
    });

    _.assign(ESYS, {
        formaturl: function(path){
            return path.replace(/EPWEBRUN/g, projectName)
        },
        formatServiceUrl : function(url) {
            url = url || location.pathname;
            if(!url.match(/^http:\/\/|^https:\/\/|^ws:\/\//)){
                url = window.xyzJsonRPCHost + url;
            }
            if(window.EPWebConfig && window.EPWebConfig.SERVICE_NAME){
                var formatUrl = url.replace(/^http:\/\/|^https:\/\/|^ws:\/\//, '');
                var firstIndex = formatUrl.indexOf('/');
                var endUrl = formatUrl.substring(firstIndex + 1);
                var endIndex = endUrl.indexOf('/');
                if(firstIndex !== -1 && endIndex !== -1){
                    var pathFull = '/EPSERVICERUN/';
                    url = url.replace(pathFull, '/' + window.EPWebConfig.SERVICE_NAME + '/');
                }
            }
            return url;
        },
    });

    //bind方法兼容
    /* if (!Function.prototype.bind) { 
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
    } */

    

    /**
     * 自动换肤, 主题随主框架换肤.
     */
    (function() {
        var themeReg = /\/esys-base-([^\.\/].+)\.css/,
            cssBase = './esys-base-',
            themeCache = {};//主题加载留痕
        /**
         * 主题管理.
         */
        var ThemeMgr = function() {
            this.initialize();
        }
        ThemeMgr.prototype = {
            initialize: function() {
                var theme = this.getDefault();
                if(theme) {
                    this.changeTheme(theme);
                }
                var _this = this;
                observer.on('base-style:stylechange', function(theme) {
                    _this.changeTheme(theme);
                });
            },
            getDefault : function() {
                var themeName = storage.getSessItem('global_theme');
                if(!themeName) {//默认橙色, 与base-style中的一致
                    themeName = 'orange';
                }
                if(themeName == 'darkblue') {
                    themeName = 'orange';
                }
                return themeName;
            },
            changeTheme : function(theme) {
                theme = theme == 'darkblue' ? 'orange' : theme;
                $('head').children('link[rel=stylesheet]').each(function() {
                    var href = $(this).attr('href');
                    if(themeReg.test(href)) {//ESYS主题样式文件
                        var name = themeReg.exec(href)[1];
                        if(name !== theme) {//删除非当前主题
                            $(this).remove();
                        }
                    }
                });
                //主题样式文件引用, 异步方式引用
                require.async(this.buildCssPath(theme));
                themeCache[theme] = true;
            },
            //构造css主题文件路径
            buildCssPath : function(theme) {
                var path = [cssBase, theme, '.css'].join('');
                if(themeCache[theme] === true) {//主题二次加载
                    var tm = new Date().getTime();
                    //文件路径添加时间戳，避免主题文件删除后, seajs二次不进行加载的问题.
                    path = path.concat('?ct').concat(tm);
                }
                return path; 
            }
        }
        new ThemeMgr();
    })();
    /**
     * 自动化处理代码.
     */
    var AutoProcessor = function() {
        return {
            process : function(name){
                this.processor[name].call();
            },
            processor : {
                condition : function() {
                    $('.condition_top_trans:not(.trans_done)').each(function() {
                        $(this).addClass('trans_done');
                        var $condition = $(this).find('.condition_top'),
                            $moreBtn = $condition.find('.condition_top_more_btn');
                        $moreBtn.click(function() {
                            if($condition.hasClass('open')) {//当前为展开状态
                                $moreBtn.removeClass('xy-shangla').addClass('xy-drop-down');
                            } else {
                                $moreBtn.removeClass('xy-drop-down').addClass('xy-shangla');
                            }
                            $condition.toggleClass('open');
                        });
                    });
                }
            }
        }
    }();
    _.assign(ESYS, {
        ap : AutoProcessor
    });
    //修改联系电话格式--临时解决方案
    $.validator && $.validator.addMethod("isTel", function(value, element) {
        var tel = /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,8}$/;
        return this.optional(element) || tel.test(value);
    }, "请正确填写您的电话号码");

    //基本所有模块都要用到的模块引入
    require('xyz-jsonRPC')($);
    /* //设置请求的全局host（跨域），前端开发人员可以不需要搭建java环境，配置服务器的host即可调试效果
    $.jsonRPC.setHost('http://10.168.2.114:8090');
    //设置debug模式，自动替换所有url中的 USAccess ===> TestUSAccess
    $.jsonRPC.setDebug(true); */
    module.exports = ESYS;
});