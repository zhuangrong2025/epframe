/*!
 * 标准化组件.
 * 
 * Author: chenming
 * Date: 2019-01-21
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Base = require('../component/Base');
    /**
     * 内置的所有统一标准组件.
     * 标准组件规范：
     * 1. 命名规范: 
     *    1) 组件名以ESYS加对外的模块名的组合，如datatable的内置组件命名为ESYSDatatable.
     *    2) 组件必须定义在EWin模块内, 如ESYSDatatable以EWin.ESYSDatatable的方式定义.
     * 2. 实现规范: 
     *    1) 组件必须继承ESYS.ComponentBase.
     *    2) constructor、initialize、render方法必须先调用父类的相同接口(参考ESYSTab的实现).
     *    3) 组件中通过this.instance获取原模块化组件的实例.
     * 内置标准组件列表：
     * ESYSTab  Tab组件
     * 
     * 标准组件的参数约定:
     * {
     *  el: el,
     *  data: options,
     *  events: events,
     *  methods: methods
     * }
     * 
     *  Author: chenming
     *  Date: 2019-01-19
     */
    var ESYSCmp = {}; 

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

    _.assign(ESYSCmp, {
        /**
         * 统一标准化组件实现注册绑定.
         * 标准化组件与原模块化组件绑定, 将原模块化组件的接口做为标准化组件的接口实现.
         * 接口调用: ESYS.component.impl(componentName, moduleName, methods)
         * 参数说明：
         * componentName: 标准化组件名称, 如ESYSTab详见标准组件列表
         * moduleName: 模块化组件名,详见模块化组件库
         * methods: 标准组件与模块化组件的方法映射, 定义为数组类型，支持以下几种情况的方法定义：
         * 1. ['method1', 'method2']  即标准组件中定义的method1、method2方法直接分别映射到模块化组件的method1、method2方法
         * 2. [{src: 'method1', desc: 'instMethod1'}] 即标准组件中定义的method1方法直接映射到模块化组件的instMethod1方法
         */
        impl : function(cmpName, module, methods) {
            var cmp = ESYSCmp[cmpName];
            if(!cmp) return;
            cmp.prototype._bindclass = module;
            if(methods)
            methods = methods || [];//直接调用实现模块化的方法
            if(!_.isArray(methods)) {//方法构造成数组
                methods = [methods];
            }
            //下面将实现方法构造成如下结构: [{src: srcName,desc:descName}, ...]
            var methodArr = [];
            _.each(methods,function(method) {
                var arr = method.split(','),
                    item = {},
                    srcName = arr[0],
                    destName = arr.length > 1 ? arr[1] : arr[0];
                methodArr.push({
                    src : srcName,
                    dest : destName
                });
            });
            cmp.prototype._bindmethods = methodArr;
        }
    });
    /**
     * 标准组件基类.
     */
    ESYSCmp.ComponentBase = Base.extend({
        constructor: function (options, scope) {
            ESYSCmp.ComponentBase.superclass.constructor.call(this, options);
            this.scope = scope || this;
        },
        initialize: function(options) {
            this.el = $(options.el);
            this.options = _.assign(this.defaults, options);
            this.events = options.events;
            this.methods = options.methods;
            this.settings = _.assign({el: options.el}, this.options,
                {events : options.events});
        },
        render: function(cb) {
            var _this = this;
            var moduleName = this._bindclass,
                methods = this._bindmethods;
            if(moduleName) {//模块化引用
                require.async(moduleName, function(module) {//引用第三方模块化组件
                    _this.instance = new module(_this.settings);
                    var instance = _this.instance;
                    _.each(methods, function(method) {//绑定模块组件的方法调用
                        _this[method.src] = instance[method.dest].bind(instance);
                    });
                    _this.instance.render();
                    cb && cb();
                });
            }
        }
    });

    
    //tab组件
    ESYSCmp.ESYSTab = ESYSCmp.ComponentBase.extend({
        defaults: {},
        constructor: function (options) {
            ESYSCmp.ESYSTab.superclass.constructor.apply(this, arguments);
            this.initialize(options);
        },
        initialize: function(options) {
            ESYSCmp.ESYSTab.superclass.initialize.call(this, options);
        },
        render: function() {
            ESYSCmp.ESYSTab.superclass.render.call(this);
        }
    });

    ESYSCmp.ESYSTable = ESYSCmp.ComponentBase.extend({
        defaults: { 
            url: null,		    //访问地址
            params : null,		//请求访问参数
            checkbox: !1,	    //是否可复选, 默认为false
            height: "500px",	    //网格高度, 默认为auto. 当height和maxHeight都为auto时，由内容决定高度
            orderField: "",	    //排序字段名, 字段名等于排序column的field
            order: "ASC",	    //排序方式，默认为"ASC", 可选值为"ASC"、"DESC", 分别表示升序和降序
            pagination: !1,     //true表示网格分页, 默认为false，不分页
            pageSize: 20,	    //每页显示20条
            columns: [],        //列定义
            emptyTips: '列表为空',
            autoLoad : true,    //
            list: []            //网格数据
        },
        constructor: function (options) {
            ESYSCmp.ESYSTable.superclass.constructor.apply(this, arguments);
            this.initialize(options);
        },
        initialize: function(options) {
            ESYSCmp.ESYSTable.superclass.initialize.call(this, options);
            this._buildColumns();
            this._initArgs();
            this.autoEvent = {};
            this._initEvents();
        },
        render: function() {
            if(!this.settings.autoLoad && !this.rendered) {
                var html = '<table class="table custom_table" style="margin: 10px 0"><thead><tr>';
                _.each(this.settings.columns, function(column) {
                    html += '<th ' + (column.width ? 'width="' + column.width + '"' : '') + '>';
                    if(column.data == 'ck') {
                        html += '<label class="mt-checkbox mt-checkbox-single mt-checkbox-outline">' +
                                '<input type="checkbox" data-set="userTable checkboxes" class="group-checkable">' +
                                '<span></span></label>';
                    } else {
                        html += column.title;
                    }
                    html += '</th>';
                });
                html += '</tr></thead>';
                html += '<tbody><tr><td colspan="'+ this.settings.columns .length +'" class="esys-empty-text">没有数据</td></tr></tbody></table>';
               
                $(this.settings.el).html(html);
            } else {
                ESYSCmp.ESYSTable.superclass.render.call(this);
                this.rendered = true;
            }
            //ESYSCmp.ESYSTable.superclass.render.call(this);
        },
        updateRow: function(rowIndex, row) {
            var table = this.instance.getXyzDataTable().getDataTable();
            table.row(rowIndex).data(row);
        },
        setParams: function(params) {
            if(!this.settings.autoLoad && !this.rendered) {//未加载
                this.lastParams = params;
            } else {
                this.instance.setParams(params);
            }
        },
        reload : function() {
            var _this = this;
            if(!this.settings.autoLoad && !this.rendered) {//未加载
                ESYSCmp.ESYSTable.superclass.render.call(this, function() {
                    _this.rendered = true;
                    _this.lastParams && _this.instance.setParams(_this.lastParams);
                    _this.instance.reload();
                });
            } else {
                this.instance.reload();
            }
        },
        dispose: function(){
            this.instance.dispose();
        },
        //构建配置项
        _buildColumns : function() {
            this.columns = [];
            var column;
            if(this.options.checkbox) {//复选框
                this.columns.push({data: 'ck', width: 50});
            }
            var hasLocked = false;//是否存在固定列
            _.each(this.options.columns, function(col, i) {
                column = {
                    data: col.field,
                    title: col.title,
                    width: col.width || 180,//列宽未显示配置时默认设置为180
                    orderable: col.orderable ? true : false,
                    dict: col.dict ? true : false,
                    dict_data: col.dict_field || col.field.toUpperCase() || ''
                };
                if(col.locked) {//固定列
                    this.settings.fixedColumns =  {leftColumns: 0, rightColumns: 1};
                } 
                if(col.tpl) {//列模板，转成render
                    _.assign(column, {render: this._parseTpl(col)});
                }
                if(col.render) {//自定义渲染
                    _.assign(column, {render: col.render});
                }
                
                this.columns.push(column);
            }, this);
        },
        _initArgs : function() {
            var _this = this;
            _.assign(this.settings, {
                ajax: {
                    url: this.options.url,
                    params: this.options.params || {}
                },
                //debug: true,//调试模式，不走用户配置接口
                columns: this.columns,
                events: {
                    onSuccess: function(datatable) {
                        _this._bindTableEvent();
                        _this.emit('datacallback', _this, _this.instance.getData());
                    }
                }
            });
        },
        _bindTableEvent: function() {
            var data = this.instance.getData();
            var _this = this;
            this.el.find('[evt-bind]').unbind('click').bind('click', function() {
                var evt_bind = $(this).attr('evt-bind');
                var row = evt_bind.split('_')[1];
                var item = data[row];
                _this.autoEvent[evt_bind].call(_this.scope, item);
            });
            this._parsePopover();//popover自动渲染和事件行为处理
            //鼠标离开表格内容区域时，隐藏所有popover的显示
            this.el.find('.table-scrollable').unbind('mouseleave').bind('mouseleave', function(e) {
                var $target = $(e.target);
                if($target.attr('data-toggle') === 'popover') return false; //鼠标移到popover时，不算离开表格
                _this.el.find('[data-toggle="popover"][aria-describedby]').popover('hide');
            });
        },
        //解析生成popover
        _parsePopover : function() {
            var $popovers = this.el.find('[data-toggle="popover"]');
            if($popovers.length) {//有使用popover的情况的处理
                //根据标签定义创建popover(参见bootstrap-popover的使用方式)
                $popovers.popover({html: true});
                //自定义处理显示
                $popovers.on('click', function() {
                    if($(this).attr('data-trigger') !== 'manual') return false;
                    $(this).popover('toggle');
                });
                //popover显示状态处理
                $popovers.on('shown.bs.popover', function () {
                    if($(this).attr('data-trigger') !== 'manual') return false;
                    //popover显示切换, 保证只显示一个popover
                    $(this).parents('tr:first').siblings().find('[data-toggle="popover"][aria-describedby]').popover('hide');
                    var $link = $(this);
                    var popoverId = $link.attr('aria-describedby');
                    //popover鼠标移开自动隐藏
                    $('#' + popoverId).one('mouseleave', function() {
                        $link.popover('hide');
                    });
                });
            }
        },
        _parseTpl : function(col) {
            var tpl = col.tpl,
                locked = col.locked;
            var _this = this;
            /* tpl && tpl.replace(/d-on-click=['"]([^'"]+)\([^>]*>/gi, function (match, method) {
                method != "__transDictText" && tplMethods.push(method)
            }); */
    
            return function(data, type, item, meta) {
                var t = tpl;
                //函数转换, 格式：{this.myfunction(item)}
                t = t.replace(/(\{this\.([^'"\{\}\(\)]+)\([^\)]*\)\})/gi, function (match, expression, fnName) {
                    if(_this.scope && _this.scope[fnName]) {
                        return _this.scope[fnName].call(_this.scope, item);
                    } else {
                        return "";
                    }
                });
                //字段值表达式转换, 表达式格式如：{item.name}
                t = t.replace(/(\{item\.([^\.\(\)\{\}]+)\})/gi, function (match, expression, pro) {
                    return item[pro] || '';
                });
                
                //链接点击事件绑定, 格式定义如：<a href="javascript:void(0)" d-on-click="this.customFun(item)">查看</a>
                t = t.replace(/(d-on-click=['"]this\.([^'"\(\)]+)\([^\)]*\)['"])/gi, function (match, expression, clickFn) {
                    var key = _.uniqueId('avt_'+meta.row+'_');
                    var atr = 'evt-bind="'+ key + '"';
                    if(_this.scope && _this.scope[clickFn]) {
                        _this.autoEvent[key] = _this.scope[clickFn];
                    }
                    if(locked) {
                        atr += ' data-locked';
                    }
                    return atr;
                });
                return t;
            }
        },
        _initEvents : function() {
            _.each(this.events, function(fn, key) {
                this.on(key, fn, this);
            }, this);
        } 
    });

    //日期快速选择组件
    ESYSCmp.ESYSDateRangePicker = ESYSCmp.ComponentBase.extend({
        defaults: {},
        constructor: function (options) {
            ESYSCmp.ESYSDateRangePicker.superclass.constructor.apply(this, arguments);
            this.initialize(options);
        },
        initialize: function(options) {
            ESYSCmp.ESYSDateRangePicker.superclass.initialize.call(this, options);
        },
        render: function() {
            ESYSCmp.ESYSDateRangePicker.superclass.render.call(this);
        }
    });
    /**
     * 绑定标准组件与第三方模块化组件的实现绑定.
     */
    ESYSCmp.impl('ESYSTab', 'xyz-tab', ['activeById', 'getCurrentCheckId']);
    ESYSCmp.impl('ESYSTable', 'xyz-simple-datatables', [/* 'setParams', 'reload', */ 'getData', 'getSelections']);
    ESYSCmp.impl('ESYSDateRangePicker', '../daterangepicker/DateRangePicker', ['setValue', 'getValue']);
    module.exports = ESYSCmp;
});