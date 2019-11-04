/**
 * 部门用户穿梭选择框.
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Base = require('../component/Base'),
        objformat = require('objectformat');

    // transfer样式
    require('./transferPop.css')

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
            this.align = options.align || 'center';
            this.isPop = options.isPop || false;
            this.key = options.key;
            this.text = options.text;
            this.alias = options.alias;
            this.remark = options.remark;
            this.value = options.value;
            this.title = options.title;
            if(!_.isArray(this.title) || this.title.length < 2) {
                this.title = ['数据', '已选数据'];
            }
            this.list = [];
            //事件集
            this.events = $.extend({}, DEFAULT_EVENTS, options.events);
        },
        render: function() {
            var _this = this;
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
                text: this.text,
                alias: this.alias,
                remark: this.remark,
                realRemove : true //真实移除数据
            });
            this.rightBox = new TransferBox({
                el: this.el.find('.esys-transfer:eq(1)'),
                key: this.key,
                text: this.text,
                alias: this.alias,
                remark: this.remark,
                realRemove : true //真实移除数据
            });
            this._bindEvents();

            // new TransferPop
            this.transferPop = new TransferPop({
                el: this.el.find('.esys-transfer:eq(1)'),
                events: {
                    saveItem: function(id, value, remark){
                        _this._replaceData(id, value, remark)
                    }
                }
            })
            if(this.isPop){
                this.transferPop.render()
            }
        },
        dispose: function() {},
        refresh: function() {

        }
    };
    //获取选中值，返回key数组
    Transfer.prototype.getValue = function() {
        var selections = this.getSelections(),
            _this = this,
            key = this.key,
            alias = this.alias,
            newSelection = [];
        _.each(selections, function(item){
            var obj = {};
            obj[key] = item[key]
            obj[alias] = item[alias]
            newSelection.push(obj)
        })
        return newSelection
    }
    //获取选中值，返回key数组
    Transfer.prototype.setValue = function(data, key) {  // data --> aliasData
        this.value = _.pluck(data, key); //已选数据
        this.aliasData = data;
        if(this.data && this.data.length) {//数据已载入
            this.load(this.data);
        }
        return this.value
    }
    //获取选中项，返回列表
    Transfer.prototype.getSelections = function() {
        return this.rightBox.getData();
    }
    //装载数据到列表框中
    Transfer.prototype.load = function(data) {
        if(!data || !data.length) {
            return;
        }
        var text = this.text,
            key = this.key,
            remark = this.remark,
            lessText = _.trim(text, '{}'),
            alias = this.alias,
            allDataMap = _.indexBy(data, key);
        if(this.value) {//有传入选中值情况
            var selections = [],
                datamap = _.indexBy(this.aliasData, key);  //在setValue中赋值，组件外部传值
            _.each(this.value, function(v) { // selections添加remark属性（系统来源）
                var remarkObj = {};
                remarkObj[remark] = allDataMap[v][remark]
                selections.push(_.assign(datamap[v], remarkObj));
            });

            datamap = _.indexBy(selections, key);
            var list = _.filter(data, function(item) {
                return !datamap[item[key]];
            });

            _.each(list, function(item){ // list中添加alias属性（别名）
                var name = item[lessText]
                item[alias] = name
            }, this)

            this.leftBox.load(list);
            this.rightBox.load(selections);
        } else {//新增的情况
            _.each(data, function(item){ // 所有data中添加alias属性（别名）
                var name = item[lessText]
                item[alias] = name
            }, this)
            this.leftBox.load(data);
            this.rightBox.load([]);
        }
    }
    //  data数据替换
    Transfer.prototype._replaceData = function(id, value, remark) {
        var newCheckbox = '',
            alias = this.alias,
            rightData = this.rightBox.getData(),
            key = this.key,
            checkboxTpl = '<input type="checkbox" class="checkboxes" value="{id}">{text}<span></span>';
        var currIndex = _.findIndex(rightData, function(item){
                return item[key] == parseInt(id)
            });
        rightData[currIndex][alias] = value
        // 操作dom
        newCheckbox = objformat(checkboxTpl, {
          id: id,
          text: value + remark
        })
        this.el.find('input[value=' + id + ']').parent().html(newCheckbox)
    }

    //数据分拣, 载入待选和已选框中
    Transfer.prototype._fillData = function(data) {
        if(this.value) {//有传入选中值情况
            var selections = [],
                key = this.key,
                datamap = _.indexBy(data, key);
            _.each(this.value, function(v) {
                selections.push(datamap[v]);
            });
            datamap = _.indexBy(selections, key);
            var list = _.filter(data, function(item) {
                return !datamap[item[key]];
            });
            this.leftBox.load(list);
            this.rightBox.load(selections);
        } else {//新增的情况
            this.leftBox.load(data);
            this.rightBox.load([]);
        }
    }

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
            this.alias = options.alias;
            this.remark = options.remark;
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
                remark = this.remark,
                itemHtml;
            _.each(data, function (n) {
                if(n){
                    itemHtml = objformat(itemTpl, {
                        key: n[key],
                        show_text : this._getRenderText(n) + '（' + n[remark] + '）'
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
                remark = this.remark,
                alias = this.alias,
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
                        show_text : this._getRenderText(item) + '（' + item[remark] + ')'
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
        //获取用户列表框中的数据
        getData : function () {
            return this.data;
        },
        //获取格式化的列表文本, 都应获取别名
        _getRenderText : function (data) {
            var alias = this.alias
            if(alias && data[alias]){
                return data[alias]
            }else{
                return this.useExpression ? objformat(this.text, data) : data[this.text];
            }
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
                    _this.el.find('.form_checkbox:not(.pre-remove) input').each(function(){
                            $(this).prop("checked", true);
                    })
                }else{
                    _this.el.find('.form_checkbox:not(.pre-remove) input').each(function(){
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
            var allCheckNum = this.el.find('.form_checkbox:not(.pre-remove) input').length;//所有checkbox
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

    /**
     * TransferPop
     * 在当前行新增浮动层，编辑并保存当前行数据
     */
     var mainTpl = '',
         maskTpl = '<div class="transfer-pop-mask"></div>'
     mainTpl += '<div class="transfer-pop">'
     mainTpl +=   '<input type="text" value="{text}">'
     mainTpl +=   '<em>{remark}</em>'
     mainTpl +=   '<span>'
     mainTpl +=     '<i class="xy-icon xy-right" title="确定"></i>'
     mainTpl +=   '</span>'
     mainTpl += '</div>'

    var TransferPop = Base.extend({
        constructor: function(options){
            TransferPop.superclass.constructor.call(this, options)
            this.initialize(options)
        },
        initialize: function (options) {
            this.el = $(options.el);
            this.events = options.events;
        },
        render: function(){
            this._bindEvents()
        },
        // 弹出层
        popover: function (itemText) {
            // 对itemText 进行slice，text和remark
            var textIndex = itemText.indexOf('（'),
                currText = itemText.slice(0, textIndex),
                currRemark = itemText.slice(textIndex, textIndex.length),
                $curItem = this.el.find('.xy-processedit').parent(),
                popHtml = objformat(mainTpl, {
                    text: currText,
                    remark: currRemark
                });
            this.el.find('.esys-transfer-bd').append(maskTpl);
            this.el.parent().siblings().append(maskTpl)
            $curItem.append(popHtml);
        },
        popHide: function () {
            this.dispose()
        },
        dispose: function () {
            this.el.find(".transfer-pop").remove()
            this.el.parents('.esys-transfer-wrap').find(".transfer-pop-mask").remove()
        },
        refresh: function(){
        },
    })

    // 事件绑定
    TransferPop.prototype._bindEvents = function() {
        var _this = this;
        // 鼠标滑过
        this.el.on('mouseenter', '.form_checkbox', function(){
            $(this).append('<i class="xy-icon xy-processedit"></i>')
        })
        // 鼠标滑出
        this.el.on('mouseleave', '.form_checkbox', function(){
            $(this).find('>i').remove()
        })
        // 点击图标编辑
        this.el.on("click", '.xy-processedit', function(){
            var itemText = $(this).parent().text()
            _this.popover(itemText)
        })

        _.each(this.events, function(fn, key) {
            this.on(key, fn, this);
        }, this);

        // 点击图标保存
        this.el.on("click", '.xy-right', function(){
            var value = $(this).parents('.transfer-pop').find('input').val(),
                remark = $(this).parents('.transfer-pop').find('em').text(),
                id = $(this).parents('.form_checkbox').find('label > input').val();
            _this.emit('saveItem', id, value, remark, _this);
            _this.popHide()
        })
    }

    module.exports = Transfer;
});
