/**
 * 首页门户微应用框架.
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        format = require('objectformat'),
        Base = require('../../public/component/Base'),
        ESYS = require('../../public/common/ESYS');
    require('jquery-ui')($);
    require('./WPortlet.css');
    
    var tpl = '<div class="esys-portal-container row"></div>';

    var idSeed = 0;
    var guid = function(prefix) {
        prefix = prefix || '';
        return prefix + (++idSeed);
    }

    var WPortlets = Base.extend({
        settings: {
            items : []
        },
        constructor: function (options) {
            WPortlets.superclass.constructor.call(this, options);
            this.initialize(options);
            
        },
        initialize: function(options) {
            this.el = $(options.el);
            this.options = _.assign({}, this.settings, options);
            this.keys = [];
            this.portlets = [];
        },
        render: function() {
            this.el.addClass('row');
            this.initEvents();
        },
        dispose: function() {
            this.el.empty();
        },
        refresh: function(opts) {
            this.dispose();
            this.render();
        },
        initEvents: function() {
            var _this = this;
            this.el.sortable({
                //connectWith: ".portlet",
                handle: ".esys-portlet-header",
                //cancel: ".esys-portlet-toggle",
                placeholder: "esys-portlet-placeholder",
                start: function (event, ui) {
                    var cols = ui.helper.attr('data-cols'),
                        cls = 'col-md-' + cols,
                        $placeholder = $('.esys-portlet-placeholder');
                    $placeholder.append('<div class="esys-portlet-placeholder-inner"></div>');
                    $placeholder.addClass(cls).height(ui.helper.height());
                },
                stop: function (event, ui) {
                    if(_this.hasChange()) {//应用发生调整，保存最新应用设置
                        //_this.save();
                        _this.emit('change', _this);
                    }
                }
            });
        },
        load: function(items) {
            this.items = [];
            this.portlets = [];
            this.keys = [];
            this.el.empty();
            _.each(items, function(item) {
                this.addItem(item);
            }, this);
        },
        addItem: function(config) {
            var _this = this;
            var $el = $('<div class="esys-portlet-item"></div>');
            $el.addClass('col-md-' + config.cols);
            var id = guid('portlet-item-');
            $el.attr('id', id);
            this.el.append($el);
            var opt =  _.assign({}, config, {el: '#' + id});
            var portlet = new Portlet(opt);
            portlet.render();
            this.items.push(config);
            this.keys.push(config.appKey);
            this.portlets.push(portlet);
            portlet.on('change', function(p, height) {
                _this.emit('change', _this);
            });
        },
        getCurrentKeys : function() {
            var $items = this.el.find('.esys-portlet-item');
            var keys = [];
            $items.each(function() {
                keys.push($(this).attr('data-key'));
            });
            return keys;
        },
        getData: function() {
            var list = [];
            var keys = this.getCurrentKeys();
            _.each(keys, function(key) {
                var portlet = _.find(this.portlets, function(item) {
                    return item.appKey === key;
                });
                portlet && list.push(portlet.getData());
            }, this);
            return list;
        },
        hasChange: function() {
            var $items = this.el.find('.esys-portlet-item');
            var keys = [];
            $items.each(function() {
                keys.push($(this).attr('data-key'));
            });
            return keys.join(',') === this.keys.join(',') ? false : true;
        }
    });
    
    var Portlet = Base.extend({
        tpl : '<div class="esys-portlet">'
            + '   <div class="esys-portlet-header">{title}<div class="esys-portlet-tools pull-right"></div></div>'
            + '   <div class="esys-portlet-content"></div>' 
            + '</div>',
        settings: {
            title : '',
            cols: 6,      //默认占用一半的区域
            height: 250,     //默认高度250
            resizable: false //高度是否可调整
        },
        constructor: function (options) {
            Portlet.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.el = $(options.el);
            this.options = _.assign({}, this.settings, options);
            this.appKey = this.options.appKey;
            if(!this.options.height) {//高度未设置，将以默认高度显示
                _.assign(this.options, {height: this.settings.height});
            }
        },
        render: function() {
            this.el.html(format(this.tpl, this.options));
            this.el.attr('data-cols', this.options.cols).attr('data-key', this.options.appKey);
            this.el.find('.esys-portlet').height(this.options.height);
            this.$box =  this.el.find('.esys-portlet');
            this.contentId = guid('portlet-content-');
            this.$header = this.el.find('.esys-portlet-header');
            this.$content = this.el.find('.esys-portlet-content');
            this.$content.attr('id', this.contentId);
            this.renderTools();
            this.createWidget();
            
            if(this.options.resizable) {//高度可调整
                var _this = this;
                this.el.find('.esys-portlet').resizable({
                    minHeight: 150, //最小150
                    handles: "s", //只调整高度, 不允许调整宽度
                    start: function(event, ui) { //创建辅助线
                        var height = ui.size.height,
                            top = ui.position.top;
                        _this.$line = $('<div class="helper-line"></div>');
                        _this.$line.css("top", (height + top) + "px");
                        $('body').append(_this.$line);
                    },
                    resize: function(event, ui) { //辅助线调校, 与其它应用在同一条线上，显示辅助线，帮助调整同一高度
                        var height = ui.size.height,
                            top = ui.helper.offset().top,
                            y = height + top;
                        var $siblings = _this.el.siblings(),
                            onLine = false; //判断是否有其它组件在同一条线上
                        $siblings.each(function() {
                            var $item = $(this);
                            var height = $item.height(),
                                position = $item.offset();
                            if(height + position.top == y) {
                                onLine = true;
                            }
                        });
                        onLine ? _this.$line.addClass('one-line') : _this.$line.removeClass('one-line');
                        _this.$line.css("top", y + "px");
                    },
                    stop: function(event, ui) {
                        var size = ui.size,
                            height = size.height;
                        _this.$line.remove();
                        _this.$line = null;
                        _this.emit('change', _this, height);
                    }
                });
            }
            //this._initAppList();
           // this._initEvents();
        },
        renderTools : function() {
            var _this = this;
            var TOOL_KEYS = {
                setting: {
                    key: 'setting',
                    cls: 'xy-icon xy-shenglvehao',
                    handler: function() {//设置的触发处理, 应用内需要定义onSetting方法来处理设置点击
                        _this.inst && _this.inst.onSetting && _this.inst.onSetting.call(_this.inst);
                    }
                }
            }
            this.tools = [];
            if(this.options.tools) {
                var tools = this.options.tools.split(',');
                _.each(tools, function(key) {
                    if(TOOL_KEYS[key]) {
                        this.tools.push(TOOL_KEYS[key]);
                    }
                }, this);
            }
            _.each(this.tools, function(tool) {
                var $icon = $('<i></i>');
                $icon.addClass(tool.cls).attr('data-key', tool.key);
                this.$header.find('.esys-portlet-tools').append($icon);
            }, this);
            this.$header.find('.esys-portlet-tools > i').unbind('click').bind('click', function() {
                var key = $(this).attr('data-key');
                if(!key) return; //没有key的情况不考虑
                var tool = _.find(_this.tools, function(item) {
                    return item.key == key;
                });
                tool && tool.handler && tool.handler();
            })
        },
        //创建组件
        createWidget : function() {
            var _this = this;
            if(this.options.url) {
                var el = '#' + this.contentId;
                this.options.url = ESYS.formaturl(this.options.url);
                require.async(this.options.url, function (WApp) {
                    var inst = new WApp({
                        el: el
                    });
                    inst.render();
                    _this.inst = inst;
                });
            } else if(this.options.content) {
                this.$content.html(this.options.content);
            }
        },
        dispose: function() {
            
            this.el.empty();
        },
        refresh: function(opts) {
            this.dispose();
            this.render();
        },
        getData: function() {
            return {
                appKey : this.options.appKey,
                title: this.options.title,
                url: this.options.url,
                height: this.$box.height(),
                resizable: this.options.resizable, 
                tools: this.options.tools,
                cols: this.options.cols
            }
        },
        getHeight: function() {
            return this.$box.height();
        },
        getPosition: function() {
            return this.el.position();
        }
    });

    module.exports = WPortlets;
});