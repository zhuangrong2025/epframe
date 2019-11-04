/*!
 * 数据列表组件封装.
 * 适用于左侧的列表展示，包含数据展示、删除、新增、过滤功能.
 *
 * Author: chenming
 * Date: 2019-01-17
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        format = require('objectformat'),
        Base = require('../component/Base'),
        XyzAlert = require('xyz-alert');

    var mainTpl = '',
        itemTpl = '';
    itemTpl += '<li data-id="{key}">';
    itemTpl += '<span>{show_text}</span>';
    itemTpl += '<i class="xy-icon xy-shanchu {delBtnCls}"></i>';
    itemTpl += '</li>';
    mainTpl += '<div class="esys-datalist">';
    mainTpl += '<div class="esys-datalist-head {searchCls}">';
    /*  搜索 组件 */
    mainTpl +=  '<div class="esys-search">';
    mainTpl +=  '<dl>';
    mainTpl +=  '<dt>';
    mainTpl +=  '<input type="text" class="form-control xyz_validate_input" placeholder="暂无过滤">';
    mainTpl +=  '<i class="fa fa-search"></i>';
    mainTpl +=  '</dt>';
    mainTpl +=  '<dd>'
    mainTpl +=  '<button type="button" class="btn btn-action-lv1 {btnCls}">{btnText}</button>';
    mainTpl +=  '</dd>';
    mainTpl +=  '</dl>';
    mainTpl +=  '</div>';
    /* 搜索 组件 */
    mainTpl += '</div>';
    mainTpl += '<div class="esys-datalist-body scroller">';
    mainTpl += '<h1 class="esys-datalist-title {titleCls}">{title}</h1>';
    mainTpl += '<ul>';
        /* 列表项 */
    mainTpl += '</ul>';
    mainTpl += '<div class="esys-empty-text hide">{emptyText}</div>';
    mainTpl += '</div>';
    mainTpl += '<div class="mt-list-footer list-simple"></div>';
    mainTpl += '</div>';

    var DataList = Base.extend({
        defaults: {
            title: '',          //列表标题
            url: '',            //数据请求地址
            params: {},         //请求参数
            key: '',            //数据主键字段
            text: '',           //数据显示字段
            keyword: 'keyword', //过滤关键字字段名
            button: false,      //是否需要新增按扭
            deletable: true,    //是否允许删除
            clickable: true,    //是否可点击
            search: true,       //默认显示搜索框
            deleteUrl: '',      //删除地址
            pageSize: 10,       //每页记录数
            emptyText: '没有数据!', //无数据提示文本
            pagination: false   //是否分页
        },
        constructor: function (options) {
            DataList.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.el = $(options.el);
            this.options = _.assign({}, this.defaults, options.data);
            this.events = options.events;
            this.methods = options.methods;
            this.settings = {};
            this.pagination = null; //分页条
            this.lastParams = this.options.params || {}; //上次请求参数
            this.data = [];//存储每次加载的最新数据
            this.pageInfo = {   // 分页信息
                start: 0,
                page: 1,
                length: this.options.pageSize
            };
            this.useExpression = /\{[^\{\}].*\}/.test(this.options.text);
        },
        render: function() {
            var opt = _.assign(this.options, {}),
                btnCls = 'hide',
                searchCls = this.options.search ? '' : 'hide',
                btnText = '新增';
            if(this.options.button !== false) {//显示按扭
                btnCls = '';
                btnText = _.isString(this.options.button) ? this.options.button : '新增';
                this.options.button = true;
            }
            _.assign(opt, {
                btnCls : btnCls,
                btnText : btnText,
                searchCls: searchCls,
                emptyText: opt.emptyText,
                titleCls: opt.title ? '' : 'hide' 
            });
            this.el.html(format(mainTpl, opt));
            this.$body = this.el.find('.esys-datalist-body');
            this.$footer = this.el.find('.mt-list-footer');
            this.$emptyTip = this.el.find('.esys-empty-text');
            this.load();
            this.initEvents();
        },
		dispose : function() {
		},
		refresh : function(params) {
			//this.loadData(params);
        },
        reload : function() {
            this.load(true);
        },
        getSelected : function() {
            var key = this.options.key;
            var $selections = this.$body.find('>ul>li.selected');
            if($selections.length) {
                var id = $selections.first().attr('data-id');
                var data = _.find(this.data, function(item) {
                    return item[key] == id;
                });
                return data;
            }
            return null;
        },
        updateItem : function(data) {
            var key = this.options.key,
                keyVal = data[key];
            if(data && !_.isUndefined(keyVal)) {
                var $item = this.$body.find('>ul>li[data-id=' + keyVal + ']');
                $item.children('span:first').html(this.getRenderText(data));
            }
        },
        //创建分页条
		createPagination : function(totalNum) {
            var _this = this;
            this.pagination = new Pagination({
                el: this.$footer,
                data: {
                    totalNum: totalNum,
                    pageSize: this.options.pageSize
                },
                events: {
                    //分页切换
                    pageselect: function(page) {
                        _.assign(_this.pageInfo, {
                            start: (page - 1) * _this.options.pageSize,
                            page: page
                        });
                        _this.load();
                    }
                }
            });
            this.pagination.render();
        },
        //加载列表数据
        load : function(pageFlag, params) {
            var _this = this,
                reqParams = {params : _.assign(this.lastParams, params)};

            if(pageFlag){
                _.assign(this.pageInfo, {start: 0, page: 1}); //重置分页信息
            }
            _this.options.pagination && _.assign(reqParams, {queryInfo : this.pageInfo});
                
            $.jsonRPC.request(this.options.url, {
                params : reqParams,
                success : function(response) {
                    var list = response.data,
                        totalNum = response.recordsTotal || 0;
                    _this.data = list;//当前加载数据

                    //列表需要分页显示, 但未创建分页条
                    if(_this.options.pagination === true) {
                        if(!_this.pagination || pageFlag){
                            _this.createPagination(totalNum);
                        }
                    }
                    _this.renderList(list);//渲染数据
                    var selectedIndex = -1;
                    if(_this.options.value !== undefined && _this.options.value !== null) {
                        var key = _this.options.key;
                        selectedIndex = _.findIndex(list, function(item) {
                            return item[key] == _this.options.value;
                        });
                        //selectedIndex = selectedIndex === -1 ? 0 : selectedIndex;
                    }
                    if(selectedIndex !== -1) {
                        _this.$body.find('>ul>li').eq(selectedIndex).click();
                    } else {
                        //默认选中第一项
                        _this.options.clickable && _this.$body.find('>ul>li:first').click();
                    }
                },
                error : function(response, url) {
                    XyzAlert.error(response.message);
                }
            });
        },
        //列表数据渲染
        renderList : function(list) {
            var $itemWrap = this.$body.children('ul'),
                delBtnCls = this.options.deletable === true ? '' : 'hide';
            $itemWrap.empty();
            list.length ? this.$emptyTip.addClass('hide') : this.$emptyTip.removeClass('hide');
            _.each(list, function(item) {
                $itemWrap.append(format(itemTpl, {
                    key: item[this.options.key],
                    delBtnCls: delBtnCls,
                    show_text: this.getRenderText(item)
                }));
            }, this);
            //列表事件绑定
            this.bindItemEvents();
        },
        //获取格式化的列表文本
        getRenderText : function (data) {
            return this.useExpression ? format(this.options.text, data) : data[this.options.text];
        },
        //列表项事件绑定
        bindItemEvents : function() {
            var _this = this,
                list = this.data,
                key = this.options.key;
            //列表项点击切换
            this.options.clickable && this.$body.find('>ul>li').unbind('click').bind('click', function() {
                var id = $(this).attr('data-id');
                $(this).siblings().removeClass('selected');
                $(this).addClass('selected');
                var data = _.find(list, function(item) {
                    return item[key] == id;
                });
                _this.emit('click', data, _this);
            });
            //点击删除
            this.$body.find('>ul>li>i').unbind('click').bind('click', function(event) {
                event.stopPropagation();
                var id = $(this).parent().attr('data-id'),
                    data = _.find(list, function(item) {
                        return item[key] == id;
                    });
                if(_this.emit('beforedelete', data, _this) === false) {//返回false不删除
                    return false;
                }
                if(!_.isEmpty(_this.options.deleteUrl)) {//有定义删除地址, 在组件内做删除
                    _this.deleteItem(id, data);//删除数据
                }
                _this.emit('delete', data, _this);
            });
        },
        //按关键字过滤
        filter : function(keyword) {
            if(this.pagination) {//分页情况远程过滤
                _.assign(this.pageInfo, {start: 0, page: 1}); //重置分页信息
                var params = {};
                params[this.options.keyword] = keyword;
                this.load(true, params);
            } else {//不分页时本地过滤
                var hideData = [],
                    key = this.options.key;
                if (!_.isEmpty(keyword)) {//需要过滤的数据项
                    hideData = _.filter(this.data, function (item) {
                        var text = this.getRenderText(item);
                        return text.indexOf(keyword) === - 1;
                    }, this);
                }
                this.$body.find('>ul>li.hide').removeClass('hide');
                _.each(hideData, function (n) {//匹配过滤关键字的隐藏
                    this.$body.find('>ul>li[data-id=' + n[key] + ']').addClass('hide');
                }, this);
            }
        },
        //删除选中项, 也可通过监听delete事件自己删除
        deleteItem : function(id) {
            var params = {};
            params[this.options.key] = id;//构造参数
            var _this = this,
                url = this.options.deleteUrl;
            function doDelete() {//执行删除操作
                $.jsonRPC.request(url, {
                    params: {
                        params: params
                    },
                    success: function(response) {
                        var data = response.data;
                        _this.load(true);//刷新列表数据
                    }
                });
            }

            XyzAlert.info("确认删除选中数据?", {
                showCancelButton: true,
                closeOnConfirm: true,
                closeOnCancel: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                confirm: doDelete
            });
        },
        initEvents : function() {
            //事件监听
            _.each(this.events, function(fn, key) {
                this.on(key, fn, this);
            }, this);
            var _this = this;
            //搜索框输入自动过滤列表
            var $searchInput = this.el.find('.esys-search :text');
            var timeoutId = null;
            function searchData() {//查找筛选角色
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                var text = $(this).val();
                timeoutId = setTimeout(function() {
                    _this.filter(text);
                }, 500);
            }
            this.options.search && $searchInput.bind('propertychange', searchData).bind('input', searchData);
            if(this.options.button === true) {//显示按扭
                this.el.find('.esys-search button').click(function() {//点击按扭事件
                    _this.emit('add', this); //点击新增按扭
                });
            }
        }
    });


    var paginationTpl = '';
    paginationTpl += '<div class="pagination-panel">';
    paginationTpl += '<span class="seperator">第 ';
    paginationTpl += '<span class="cur-page">{page}</span> 页(共 <span class="total-page">{totalPage}</span>';
    paginationTpl += '页)</span> ';
    paginationTpl += '<a href="#" data-page="{prevPage}" class="btn btn-sm default prev disabled list_item_pagin"> ';
	paginationTpl += '<i class="fa fa-caret-left"></i>';
    paginationTpl += '</a>';
    paginationTpl += '<input type="text" class="pagination-panel-input form-control input-sm input-inline input-mini">';
    paginationTpl += '<a href="#" data-page="{nextPage}" class="btn btn-sm default next disabled list_item_pagin">';
    paginationTpl += '<i class="fa fa-caret-right"></i>';
	paginationTpl += '</a>';
    paginationTpl += '</div>';
    /**
     * 分页组件.
     * 暂时在DataList中使用，后续可在所有组件通用.
     */
    var Pagination = Base.extend({
        defaults: {
            page: 1,        //当前页
            pageSize: 10,   //每页记录数
            totalNum: 0,    //总记录数
            totalPage: 1	//总页数
        },
        constructor: function (options) {
            Pagination.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.el = $(options.el);
            this.options = _.assign({}, this.defaults, options.data);
            this.events = options.events;
            this.methods = options.methods;
            this.page = this.options.page;
            _.assign(this.options, {//重新记录总页数
                totalPage : Math.max(Math.ceil(this.options.totalNum/this.options.pageSize), 1)
            });
        },
        render: function() {
            this.el.html(format(paginationTpl, this.options));
            this.toPage(this.page); //切换到初始当前页
            this.bindEvents();
        },
		dispose : function() {
		},
		refresh : function() {
        },
        //重新刷新加载分页信息
        reload : function(options) {
            _.assign(this.options, options || {});
            this.page = 1; //重置当前页为1
            this.el.find('span.total-page').text(this.options.totalPage);
            this.toPage(this.page);
        },
        toPage : function(page) {
            //待处理，添加若干判断
            this.page = page;
            var $prevLink = this.el.find('a.prev'),
                $nextLink = this.el.find('a.next'),
                isFirstPage = page === 1 ? true : false,
                isLastPage = page === this.options.totalPage ? true : false,
                prevPage = isFirstPage ? 0 : page - 1, //上一页
                nextPage = isLastPage ? this.options.totalPage : page + 1; //上一页
            this.el.find('span.cur-page').text(page);
            $prevLink.attr('data-page', prevPage);
            $nextLink.attr('data-page', nextPage);
            isFirstPage ? $prevLink.addClass('disabled') : $prevLink.removeClass('disabled');
            isLastPage ? $nextLink.addClass('disabled') : $nextLink.removeClass('disabled');
        },
        bindEvents: function() {
            _.each(this.events, function(fn, key) {
                this.on(key, fn, this);
            }, this);
            var _this = this;
            //切换到指定页
            this.el.find('a[data-page]').unbind('click').bind('click', function() {
                if(!$(this).hasClass('disabled')) {//禁用时不处理
                    var page = 1 * $(this).attr('data-page') || _this.page;
                    _this.toPage(page);
                    _this.emit('pageselect', page, _this);
                }
            });
        }
    });

	module.exports = DataList;
});
