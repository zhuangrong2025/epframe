/**
 * 部门用户穿梭选择框.
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        objformat = require('objectformat');
    
    var tpl = '',
        itemTpl = '';
    tpl += '<div class="container esys-transfer-wrap">';
    tpl +=     '<div class="row">';
    tpl +=        '<div class="col-md-5">';
    tpl +=            '<div class="esys-transfer">';
    tpl +=                '<div class="esys-transfer-hd">';
    tpl +=                     '<span class="pull-left esys-transfer-label">';    
    tpl +=                          '{left_title}<em>(0)</em>';
    tpl +=                          '<label class="mt-checkbox mt-checkbox-single mt-checkbox-outline">';
    tpl +=                              '<input type="checkbox" class="checkboxes" />';
    tpl +=                                  '<span></span>';
    tpl +=                          '</label>';
    tpl +=                       '</span>';
    tpl +=                     '<div class="pull-right">';
    tpl +=                         '<div class="input-group">';
    tpl +=                             '<input type="text" class="form-control search-input-btn" placeholder="输入关键字搜索">';
    tpl +=                             '<span class="input-group-btn">'
    tpl +=                                  '<button type="button" class="btn grey-steel search-icon-btn">';
    tpl +=                                     ' <i class="fa fa-search"></i>';
    tpl +=                                  '</button>';
    tpl +=                              '</span>';
    tpl +=                          '</div>';
    tpl +=                      '</div>';
    tpl +=                  '</div>';
    tpl +=                  '<div class="esys-transfer-bd">'
    tpl +=                   '</div>';
    tpl +=               '</div>';
    tpl +=           '</div>';
    tpl +=           '<div class="col-md-1 esys-transfer-mid">';
    tpl +=               '<button class="btn btn-action-lv1 esys-transfer-move-right"><i class="xy-icon xy-more"></i>&nbsp;</button>';
    tpl +=               '<button class="btn btn-view-lv1 esys-transfer-move-left">&nbsp;<i class="xy-icon xy-return"></i></button>';
    tpl +=           '</div>';
    tpl +=           '<div class="col-md-5">';
    tpl +=               '<div class="esys-transfer">';
    tpl +=                   '<div class="esys-transfer-hd">';
    tpl +=                     '<span class=" right-transfer esys-transfer-label">';    
    tpl +=                          '{right_title}<em>(0)</em>';
    tpl +=                          '<label class="mt-checkbox mt-checkbox-single mt-checkbox-outline">';
    tpl +=                              '<input type="checkbox" class="checkboxes"/>';
    tpl +=                                  '<span></span>';
    tpl +=                          '</label>';
    tpl +=                       '</span>';    
    tpl +=                   '</div>';
    tpl +=                   '<div class="esys-transfer-bd">';
    tpl +=                   '</div>';
    tpl +=               '</div>';
    tpl +=           '</div>';
    tpl +=      '</div>';
    tpl +=  '</div>';
    itemTpl += '<div class="form_checkbox">';
    itemTpl += '<label class="mt-checkbox mt-checkbox-single mt-checkbox-outline">';
    itemTpl += '<input type="checkbox" class="checkboxes" value="{key}"/>';
    itemTpl += '{show_text}';
    itemTpl += '<span></span>';
    itemTpl += '</label>';
    itemTpl += '</div>';

    var DEFAULT_EVENTS = {
        beforeMoveToRight: function(selections, leftBoxData, rightBoxData){}
    };

    var Transfer = function(options) {
        this.initialize(options);
    };

    Transfer.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            //this.dep_id = options.dep_id;
            this.align = options.align || 'center',
            this.key = options.key;
            this.text = options.text;
            this.value = options.value; 
            this.title = options.title;
            this.dataRules = {};//数据规则
            if(!_.isArray(this.title) || this.title.length < 2) {
                this.title = ['数据', '已选数据'];
            }
            this.list = [];
            this.disItems = [];
            //事件集
            this.events = $.extend({}, DEFAULT_EVENTS, options.events);
        },
        render: function() {
            tpl = objformat(tpl, {
                left_title: this.title[0],
                right_title: this.title[1]
            });
            this.el.html(tpl);
            if(this.align === 'left') {
                this.el.children('.esys-transfer-wrap').removeClass('container');
            }
            this.leftBox = new TransferBox({
                el: this.el.find('.esys-transfer:eq(0)'),
                key: this.key,
                text: this.text
            });
            this.rightBox = new TransferBox({
                el: this.el.find('.esys-transfer:eq(1)'),
                key: this.key,
                text: this.text,
                realRemove : true //真实移除数据
            });
            this._bindEvents();
        },
        dispose: function() {},
        refresh: function() {

        }
    };
    //获取选中值，返回key数组
    Transfer.prototype.getValue = function() {
        var selections = this.getSelections();
        return _.pluck(selections, this.key);
    }
    //获取选中值，返回key数组
    Transfer.prototype.setValue = function(data) {
        this.value = data; //已选数据
        if(this.data && this.data.length) {//数据已载入
            this.load(this.data);
        }
    }
    //获取选中项，返回列表
    Transfer.prototype.getSelections = function() {
        return this.rightBox.getData();
    }
    //标识数据规则
    Transfer.prototype.setRule = function(conf) {
        var type = conf.type,
            filter = conf.filter,
            list = conf.list;
        if(list && list.length) {
            this.dataRules[type] = {values: list};
        } else if(filter) {
            this.dataRules[type] = {values: filter(this.data), filter: filter};
        }
    }
    //根据规则获取数据值
    Transfer.prototype.getValueByRule = function(key) {
        var rule = this.dataRules[key],
            values = [];
        if(rule) {
            values = rule.filter ? rule.filter(this.data) : rule.values;
        }
        return values;
    }
    //获取非法数据
    Transfer.prototype.validate = function() {
        var data = this.rightBox.getDisabledData();
        return data && data.length ? false : true;
    }
    //获取非法数据
    Transfer.prototype.validateByRule = function(key) {
        var result = true;
        var keys = [];
        if(_.isArray(key)) {
            keys = key;
        } else {
            keys = [key];
        }
        var data = this.rightBox.getDisabledData();
        var values = _.pluck(data, this.key);
        _.each(keys, function(_key) {
            var ruleVals = this.getValueByRule(_key);
            if(_.intersection(values, ruleVals).length) {
                result = true;
                return false;
            }
        }, this);
        return result;
    }
    //装载数据到列表框中,数据自动分拣, 载入待选和已选框中
    Transfer.prototype.load = function(data) {
        /* if(!data || !data.length) {
            return;
        } */
        this.data = data;
        if(this.value) {//有传入选中值情况
            var selections = [],
                key = this.key, 
                datamap = _.indexBy(data, key);
            _.each(this.value, function(v) {
                datamap[v] && selections.push(datamap[v]);
            });
            datamap = _.indexBy(selections, key);
            var list = _.filter(data, function(item) {
                return !datamap[item[key]];
            });
            this.leftBox.load(list);
            this.rightBox.load(selections);
            _.each(this.disItems, function(item) {
                this.leftBox._disableItem(item.code, true, item.tips);
                this.rightBox._disableItem(item.code, item.locked, item.tips);
            }, this);
        } else {//新增的情况
            this.leftBox.load(data);
            this.rightBox.load([]);
        }
    }

    Transfer.prototype.disableItems = function(data, options) {
        options = options || {};
        var tips = options.tips || '',
            locked = options.locked || false;
        _.each(data, function(code)  {
            var index = _.findIndex(this.disItems, function(item) {
                return item.code == code;
            });
            if(index != -1) {
                this.disItems[index].tips = tips;
            } else {
                this.disItems.push({code: code,tips : tips, locked: locked});
            }
        }, this);
        this.leftBox._disableItem(data, true, tips);
        this.rightBox._disableItem(data, locked, tips);
    };

    //用户数据右移
    Transfer.prototype._moveToRight = function() {
        var selections = this.leftBox.getSelections();
        if($.isFunction(this.events.beforeMoveToRight)
                && false === this.events.beforeMoveToRight(selections, this.leftBox.getData(), this.rightBox.getData())){
            return;
        }
        this.leftBox.remove(selections);
        this.rightBox.add(selections);
    }
    //用户数据左移
    Transfer.prototype._moveToLeft = function() {
        var selections = this.rightBox.getSelections();
        this.rightBox.remove(selections);
        this.leftBox.add(selections);
        this.leftBox._disableItem(this.disItems, true);
    } 
    //数据筛选
    Transfer.prototype._searchData = function(text) {
        this.leftBox.filter(text);
    }
    
    Transfer.prototype._bindEvents = function() {
        var _this = this;
        var timeoutId = null;
        function searchItem() {
            if (timeoutId) { 
                clearTimeout(timeoutId);
            }
            var text = $(this).val();
            timeoutId = setTimeout(function() {
                _this._searchData(text); 
            }, 500);
        }
        this.el.find(".search-input-btn").bind("propertychange", searchItem)
            .bind("input", searchItem);
        this.el.find('.esys-transfer-move-right').click(function() {
            _this._moveToRight();
        });
        this.el.find('.esys-transfer-move-left').click(function() {
            _this._moveToLeft();
        }); 
    }

    /**
     * 列表框, Transfer需要用到类.
     * 用于数据加载、移除等操作.
     */
    var TransferBox = function (options) {
        this.initialize(options);
    };

    TransferBox.prototype = {
        initialize: function (options) {
            this.el = $(options.el);
            this.key = options.key;
            this.text = options.text;
            this.title = options.title || '数据列表';
            if(_.isEmpty(this.key)) {
               throw new Error('the property key is undefined!');
            }
            if(_.isEmpty(this.text)) {
                throw new Error('the property text is undefined!');
             }
            this.useExpression = /\{[^\{\}].*\}/.test(this.text);
            this.realRemove = options.realRemove; //是否真实移除, false只做隐藏，不移除
            this.data = [];//数据
            this.map = {}; //映射数据, key: data的格式
        },
        //一次性加载数据到列表框中
        load : function (data) {
            if (!data) return;
            this.data = data;
            this.map = _.indexBy(this.data, this.key);
            var itemArr = [],
                key = this.key,
                itemHtml;
            _.each(data, function (n) {
                if(n){
                    itemHtml = objformat(itemTpl, {
                        key: n[key],
                        show_text : this._getRenderText(n)
                    });
                    itemArr.push(itemHtml);
                }
            }, this);
            this.el.find('.esys-transfer-bd').html(itemArr.join(''));
            this.el.find('.esys-transfer-label>em').html('(' + data.length + ')');
            this._checkAllOrNot();
        },
        //添加数据到列表框中
        add : function (data) {
            var key = this.key,
                code;
            _.each(data, function(item) {
                this.data.push(item);
                code = item[key];
                if(this.map[code]) {//已存在，显示出来
                    this.map[code].remove = false;//取消删除标记
                } else {
                    this.map[code] = item;
                }
                var $item = this.el.find('input[value=' + code + ']').parents('.form_checkbox');
                if($item.length) {//已存在，显示出来
                    $item.removeClass('hide pre-remove');
                } else {
                    var itemHtml = objformat(itemTpl, {
                        key: item[key],
                        show_text : this._getRenderText(item)
                    });
                    this.el.find('.esys-transfer-bd').append(itemHtml);
                }
            }, this);
            if(data && data.length) {
                //排除重复项,防止重复项进来造成脏数据
                this.data = _.uniq(this.data, this.key);
                this._refreshCounter();
            }
            this._checkAllOrNot();
        },
        //从列表框中删除数据
        remove : function (data) {
            var key = this.key,
                code;
            _.each(data, function(n) {
                code = n[key];
                var $item = this.el.find('input[value=' + code + ']').parents('.form_checkbox');
                this.map[code].remove = true; //移除标记
                if(this.realRemove) {//真实删除
                    $item.remove();
                } else {
                    $item.addClass('pre-remove').find('input[type=checkbox]').prop("checked", false); //取消选中状态
                }
                _.remove(this.data, function(item) { //删除数据
                    return item[key] === code;
                });
            }, this);
            if(data && data.length) {
                this._refreshCounter();
            }
            this.el.find('.esys-transfer-label > label > input').prop("checked", false);
        },
        //在列表框中过滤查找数据
        filter : function (keyword) {
            var hideData = [], 
                key = this.key;
            if (!_.isEmpty(keyword)) {//需要过滤的数据项
                hideData = _.filter(this.data, function (item) {
                    var text = this._getRenderText(item);
                    return text.indexOf(keyword) === - 1;
                }, this);
            }
            this.el.find('.form_checkbox.hide').removeClass('hide');
            _.each(hideData, function (n) {//匹配过滤关键字的隐藏
                this.el.find('.form_checkbox:not(.pre-remove) input[value=' + n[key] + ']').parents('.form_checkbox').addClass('hide');
            }, this);
        },
        //获取选中用户数据
        getSelections : function () {
            var selections = [],
                _this = this,
                items = this.el.find('.form_checkbox:not(.pre-remove) input[type=checkbox]:checked');
            items.each(function () {
                selections.push(_this.map[$(this).val()]);
            }, this)
            return selections;
        },
        //获取禁用数据
        getDisabledData : function () {
            var selections = [],
                _this = this,
                items = this.el.find('.form_checkbox.esys-disabled:not(.pre-remove) input[type=checkbox]');
            items.each(function () {
                selections.push(_this.map[$(this).val()]);
            }, this)
            return selections;
        },
        //获取用户列表框中的数据
        getData : function () {
            return this.data;
        },
        _disableItem: function(data, locked, tips) {
            if(_.isString(data)) {
                data = [data];
            }
            //locked  是否可选  true：可选， false： 不可选
            _.each(data, function(n) {
                var _v = '', _tips = '', _locked = false;
                if(_.isObject(n)) {
                    _v = n.code;
                    _tips = n.tips;
                    _locked = n.locked;
                } else {
                    _v = n;
                    _tips = tips;
                    _locked = locked
                }
                var $ckbox = this.el.find('.form_checkbox:not(.pre-remove) input[value=' + _v + ']'),
                    $item = $ckbox.parents('.form_checkbox');
                _tips && $item.attr('title', _tips);
                $item.addClass('esys-disabled');
                if(_locked) {
                    $ckbox.attr('disabled', true);
                    $item.addClass('esys-locked');
                }
            }, this)
        },
        //获取格式化的列表文本
        _getRenderText : function (data) {
            return this.useExpression ? objformat(this.text, data) : data[this.text];
        },
        //更新当前数量
        _refreshCounter : function () {
            this.el.find('.esys-transfer-label>em').html('(' + this.data.length + ')');
        },
       //全选反选复选款
       _checkAllOrNot : function(){
           var _this = this;
            this.el.find('.esys-transfer-label > label > input').click(function(){
                if($(this).prop("checked") == true){ 
                    _this.el.find('.form_checkbox:not(.pre-remove)').each(function() { 
                        if(!$(this).hasClass('esys-locked')) {
                            $(this).find('input').prop("checked", true);  
                        }
                    })
                }else{
                    _this.el.find('.form_checkbox:not(.pre-remove) input').each(function() { 
                        $(this).prop("checked", false);  
                    })
                }
            });
            this.el.find('.esys-transfer-bd .form_checkbox input').click(function(){
                _this._checkItem();
            });
       },
        //判断是否全选用户角色
        _checkItem : function(){
            var allCheckNum = this.el.find('.form_checkbox:not(.pre-remove.esys-locked) input').length;//所有checkbox
            var checkedNum=0,//已选中的
                notCheckedNum=0;//未选中的
            this.el.find('.form_checkbox:not(.pre-remove) input').each(function(){ 
                if($(this).prop("checked") == true){ 
                    checkedNum = checkedNum+1;
                } 
                else{ 
                    notCheckedNum = notCheckedNum+1;
                } 
            })
            if (allCheckNum == checkedNum) {
                this.el.find('.esys-transfer-label > label > input').prop('checked',true);
            }else {
                this.el.find('.esys-transfer-label > label > input').prop('checked',false);
            }
           
        } 
    };

    module.exports = Transfer;
});