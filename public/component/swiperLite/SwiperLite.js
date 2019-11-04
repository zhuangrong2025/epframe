/*
 * 轮播组件封装
 * TODO：默认第一页时，向右拖放，第二页面的内容会折行下来，可能是page为0，全局的宽度为0
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        format = require('objectformat'),
        Base = require('../Base');

        // backlog样式
        require('./swiperLite.css')

    var mainTpl = ''
    mainTpl +='<div class="swiperlite-container">';
    mainTpl +=  '<div class="swiperlite-wrapper">';
    mainTpl +=  '</div>';
    mainTpl +=  '<div class="swiperlite-pagination">';
    mainTpl +=  '</div>';
    mainTpl +='</div>';

    var SwiperLite = Base.extend({
        defaults: {
            pageSize: 2      //每页记录数
        },
        constructor: function (options) {
            SwiperLite.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.options = _.assign({}, this.defaults, options.data);
            this.events = options.events;
            this.el = options.el;
            this.page = 0;
            this.slideContents = this.options.slideContents || []
        },
        render: function() {
            $(this.el).html(mainTpl);
            this._renderContent(this.slideContents);

            // 设置宽度
            var $el = $(this.el),
                swiperWidth = $el.width();
            this.$wrapper = $el.find('.swiperlite-wrapper');
            this.$slide = $el.find('.slide');
            this.$footer = $el.find('.swiperlite-pagination');

            // 初始化宽度
            this.$wrapper.width(swiperWidth * this.$slide.length)
            this.$slide.width(swiperWidth)
            this.createPagination(this.slideContents);
            this._bindEvent();
            this.emit('render', this);
        },
        dispose: function(){ 
            $(this.el).empty();
        },
        refresh: function(){
            this.dispose();
            this.render();
        },
        // 创建分页条
		createPagination : function(slideContents) {
            var _this = this;
            this.pagination = new Pagination({
                el: this.$footer,
                data: {
                    totalPage: slideContents.length
                },
                events: {
                    //分页切换
                    pageselect: function(page) {
                        _this.page = page;
                        _this._changePagination(page);
                    }
                }
            });
            this.pagination.render();
        }
    });
    // 窗口缩放宽度自适应
    SwiperLite.prototype._adapteSize = function(slideContents) {
        var _this = this,
            swiperWidth = $(this.el).width();
        this.$wrapper.width(3000) // 先$wrapper比较大，后$slide，避免折行
        setTimeout(function() {
            _this.$wrapper.width(swiperWidth * _this.$slide.length)
            _this.$slide.width(swiperWidth)
        }, 50);
    }
    //渲染内容slide
    SwiperLite.prototype._renderContent = function(slideContents) {
        var $wrapper = $(this.el).find('.swiperlite-wrapper');
        _.each(slideContents, function(slide){
            $wrapper.append('<div class="slide">' + slide + '</div>')
        }, this)
    }

    // 分页切换
    SwiperLite.prototype._changePagination = function(page) {
        var swiperWidth = $(this.el).width(),
            swiperPosi = -swiperWidth * page
        this.$wrapper.css('transform', 'translate3d(' + swiperPosi + 'px, 0px, 0px)')
    }

    // 事件绑定
    SwiperLite.prototype._bindEvent = function() {
        var _this = this;
        _.each(this.events, function(fn, key) {
            this.on(key, fn, this);
        }, this);
        // 缩放窗口
        var timeoutId = null;
        $(window).on('resize', function() {
            var page = _this.page;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(function() {
                _this._adapteSize()
                _this._changePagination(page); // .swiperlite-wrapper的transform也要相应变化
            }, 20);
        });
    }

    /**
     * 分页组件.
     */
    var paginationTpl = '<span data-page="{page}" class="{cls}"></span>';

    var Pagination = Base.extend({
        constructor: function (options) {
            Pagination.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.el = $(options.el);
            this.options = _.assign({}, options.data);
            this.events = options.events;
        },
        render: function() {
            for(var i = 0; i < this.options.totalPage; i++){
                var opt = _.assign({}, {page: i})
                if(i == 0) {
                    opt = _.assign({}, opt, {cls: 'active'})
                }
                $(this.el).append(format(paginationTpl, opt));
            }
            // 事件绑定
            this.bindEvents();
        },
        dispose : function() {
        },
        refresh : function() {
        },
        toPage : function(page) {
            this.el.find('span').removeClass('active');
            this.el.find('span[data-page = ' + page + ']').addClass('active')
        },
        bindEvents: function() {
            _.each(this.events, function(fn, key) {
                this.on(key, fn, this);
            }, this);
            var _this = this;
            //切换到指定页
            this.el.find('span[data-page]').bind('click', function() {
                var page = $(this).attr('data-page') || 0;
                _this.toPage(page);
                _this.emit('pageselect', page, _this);
            });
        }

    })
    module.exports = SwiperLite;
});
