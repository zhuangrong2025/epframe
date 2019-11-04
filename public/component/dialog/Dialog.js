/*!
 * 对话框组件封装.
 * 
 * Author: chenming
 * Date: 2019-01-16
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        format = require('objectformat'),
        Base = require('../Base');

    var mainTpl = '',
        buttonTpl = '<button class="btn {cls}" data-type="{type}">{title}</button>';
    mainTpl +='<div id="{id}" role="dialog" aria-hidden="true" class="modal fade xyz_modal">';
    mainTpl +=    '<div class="dialog-mask">';
    mainTpl +=    '</div>';
    mainTpl +=    '<div class="modal-dialog">';
    mainTpl +=        '<div class="modal-content">';
    mainTpl +=            '<div class="modal-header">';
    mainTpl +=                '<h4 class="modal-title">';
    mainTpl +=                    '<span>{title}</span>';
    mainTpl +=                '</h4>';
    mainTpl +=            '</div>';
    mainTpl +=            '<div class="modal-body">';
    mainTpl +=            '</div>';
    mainTpl +=            '<div class="modal-footer pull-center">';
    mainTpl +=            '</div>';
    mainTpl +=        '</div>';
    mainTpl +=    '</div>';
    mainTpl +='</div>';

    var Dialog = Base.extend({
        defaults: { 
            title: '',		    //标题
            content: '',        //对话框内容
            url : '',           //对话框的链接页面路径
            width : 'auto',
            height: 'auto',
            buttons : [],       //按扭定义
            buttonAlign: 'center', //按扭默认右对齐
            draggable: false,   //默认不允许拖动
            closable: true,     //默认可关闭
            params : null		//请求访问参数
        },
        constructor: function (options) {
            Dialog.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.id = _.uniqueId('esys_dialog_');
            this.options = _.assign({}, this.defaults, options.data);
            this.events = options.events;
            this.methods = options.methods;
            this.settings = {};
            this.modCache = null;
        },
        render: function() {
            this.el = $('#' + this.id);
            if(this.el.length !== 0){
                var inst = this.el.data('inst');
                if(inst){
                    inst.dispose();
                }
            }
            var mainHtml = format(mainTpl, {
                id: this.id,
                title: this.options.title
            });
            $('body').append(mainHtml);
            this.el = $('#' + this.id);
            this.el.data('inst', this);
            if(this.options.width && _.isNumber(this.options.width)) {
                this.el.find('.modal-dialog').css('width', this.options.width);
            }
            if(this.options.height && _.isNumber(this.options.height)) {
                this.el.find('.modal-body').css({
                    height : this.options.height,
                    overflow : 'auto'
                });
            }
            this._renderContent();
            this._renderButtons();
            this._initEvents();
            this.show();
            //this._buildColumns();
            //this._renderDatatable();
        },
        dispose: function(){
            this.el.remove();
            this.mask && this.mask.remove();
        },
        refresh: function(){
            this.dispose();
            this.render();
        },
        find : function(selector) {
            return this.el.find(selector);
        },
        show: function() {
            this.el.modal('show');
            this.mask = this.el.next('.modal-backdrop');
        },
        close: function() {
            this.dispose();
        }
    });
    //渲染内容
    Dialog.prototype._renderContent = function() {
        if(this.options.url) {
            if(this.modCache && this.modCache.modObj) {   //如果当前页已初始化过
                if(this.modCache.refresh === true){   //刷新模块
                    var modObj = this.modCache.modObj;
                    if(modObj.refresh){
                        modObj.refresh();
                    } else {
                        if(modObj.dispose){
                            modObj.dispose();
                        }
                        modObj.render();
                    }
                }
            } else {
                var _this = this, 
                    bodyId = _.uniqueId('esys_dialog_body_'),
                    url = this.options.url,
                    options =  this.options.options;
                this.el.find('.modal-body').attr('id', bodyId);
                require.async(url, function(ChildMod){
                    if(!ChildMod){
                        throw '无法获取子模块! url: ' + url;
                    }
                    var opt = {
                        el: '#' + bodyId
                    };
                    _.extend(opt, options || {});
                    var cm = new ChildMod(opt);
                    _this.el.on("shown.bs.modal", function() {
                    	cm.render();
                    	_this.modCache = {};
                    	_this.modCache.modObj = cm;
                    });
                });
            }
        } else {
            this.el.find('.modal-body').html(this.options.content);
        }
    }
    var buttonsDef = {
        cancel : {type: 'cancel', title: '取消', cls: 'btn-cancel', handler: function() {
            this.close();
        }},
        save : {type: 'save', title: '保存', cls: 'btn-action-lv1', handler: function() {
            var inst = this.getInstance();
            if(inst) {
                var _this = this;
                var cb = function() {
                    _this.close();
                }
                inst.save && inst.save(cb)
            }
        }}
    };
    //渲染按扭
    Dialog.prototype._renderButtons = function() {
        var buttons = [],
            initBtns = this.options.buttons;
        if(initBtns === true) {
            initBtns = ['cancel', 'save'];
        } 
        if(_.isArray(initBtns)) {
            _.each(initBtns, function(btn) {
                if(_.isString(btn)) {
                    buttons.push(_.assign({}, buttonsDef[btn]));
                } else {
                    buttons.push(_.assign({},buttonsDef[btn.type], btn));
                }
            });
        }
        if(buttons.length) {
            var btnArr = [];
            _.each(buttons, function(btn) {
                var btnHtml = format(buttonTpl, btn);
                btnArr.push(btnHtml);
            });
            this.el.find('.modal-footer').html(btnArr.join(''));
        }
        this.buttons = _.indexBy(buttons, 'type');
    }

    //初始事件
    Dialog.prototype._initEvents = function() {
        var _this = this;
        this.el.find('.modal-footer .btn').click(function() {
            var type = $(this).attr('data-type');
            if(_this.buttons[type] && _this.buttons[type].handler) {//按扭点击
                _this.buttons[type].handler.call(_this, _this);
                _this.emit(_this._getEventName(type), _this);
            }
        });
        _.each(this.events, function(fn, key) {
            this.on(key, fn, this);
        }, this);
    }

    //初始事件
    Dialog.prototype._getEventName = function(type) {
        var eveKeys = {save: 'save', cancel: 'cancel'};
         return eveKeys[type];
    }

    Dialog.prototype.getInstance = function() {
        return this.modCache &&  this.modCache.modObj;
    };

    module.exports = Dialog;
});