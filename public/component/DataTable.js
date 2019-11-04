/*!
 * 网格组件二次封装.
 * 
 * Author: chenming
 * Date: 2019-01-10
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Base = require('./Base'),
        ShineDatatables = require('shine-datatables');
    

    var DataTable = Base.extend({
        defaults: { 
            url: null,		    //访问地址
            params : null,		//请求访问参数
            checkbox: !1,	    //是否可复选, 默认为false
            height: "auto",	    //网格高度, 默认为auto. 当height和maxHeight都为auto时，由内容决定高度
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
            DataTable.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.el = $(options.el);
            this.options = _.assign(this.defaults, options.data);
            this.events = options.events;
            this.methods = options.methods;
            this.settings = {};
            this.module = options.module;
            this.autoEvent = {};
            this._initEvents();
        },
        render: function() {
            this._buildColumns();
            this._renderDatatable();
        },
        dispose: function() {},
        refresh: function() {

        },
        setParams: function() {
            this.table.setParams.apply(this.table, arguments);
        },
        reload: function() {
            this.table.reload.apply(this.table, arguments);
        },
        getData: function() {
            return this.table.getData.call(this.table);
        }
    });
    //构建配置项
    DataTable.prototype._buildColumns = function() {
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
                width: col.width,
                orderable: col.orderable ? true : false
            };
            if(col.locked) {//固定列
                this.settings.fixedColumns =  {rightColumns: 1};
            } 
            if(col.tpl) {//列模板，转成render
                _.assign(column, {render: this._parseTpl(col)});
            }
            if(col.render) {//自定义渲染
                _.assign(column, {render: col.render});
            }
            this.columns.push(column);
        }, this);
    }

    //渲染表格
    DataTable.prototype._renderDatatable = function() {
        var _this = this;
        var opt = {
            el: this.el, 
            id: this.options.id,
            ajax: {
                url: this.options.url,
                params: this.options.params || {}
            },
            events: {
                dataCallback : function() {
                    var data = _this.table.getData();
                    _this.el.find('[evt-bind]').unbind('click').bind('click', function() {
                        var evt_bind = $(this).attr('evt-bind');
                        var row = evt_bind.split('_')[1];
                        var item = data[row];
                        _this.autoEvent[evt_bind].call(_this.module, item);
                    });
                    _this.emit('datacallback', _this, data);
                }
            },
            columns: this.columns,
            debug: true   //调试模式，不走用户配置接口
        };
        _.assign(opt, this.settings);
        this.table = new ShineDatatables(opt);
        this.table.render();
    }

    //初始事件
    DataTable.prototype._initEvents = function() {
        _.each(this.events, function(fn, key) {
            this.on(key, fn, this);
        }, this);
    }
            
    //创建步骤
    DataTable.prototype._parseTpl = function(col) {
        var tpl = col.tpl;
        var _this = this;
        /* tpl && tpl.replace(/d-on-click=['"]([^'"]+)\([^>]*>/gi, function (match, method) {
            method != "__transDictText" && tplMethods.push(method)
        }); */

        return function(data, type, item, meta) {
            var t = '';
            tpl.replace(/\{(item\.[^\.\(\)\{\}]+)\}/gi, function (match, expression) {//字段值表达式转换
                var name = expression.replace('item.', '');
                t = tpl.replace('{'+expression+'}', item[name]);
            });
            tpl.replace(/d-on-click=['"](module\.[^'"\(\)]+)\([^\)]*\)['"]/gi, function (match, expression) {//字段值表达式转换
                var key = _.uniqueId('avt_'+meta.row+'_');
                var atr = 'evt-bind="'+key+'"';
                var m = expression.replace('module.', '');
                if(_this.module && _this.module[m]) {
                    _this.autoEvent[key] = _this.module[m];
                }
                // t = tpl.replace('{'+expression+'}', item[name]);
                t = (t || tpl).replace(/d-on-click=['"](module\.[^'"\(\)]+)\([^\)]*\)['"]/, atr);
            });
            return t;
        }
    }


    module.exports = DataTable;
});