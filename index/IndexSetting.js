define(function(require, exports, module) {

    var $ = require('jquery'),
        _ = require('lodash'),
        observer = require('observer');

    //模板引入
    var mainTpl = require('./template/IndexSetting.html');

    function IndexSetting(options) {
        this.initialize(options);
    };

    IndexSetting.prototype = {
        initialize: function(options) {
            this.indexToolBar = options.main
            this.currentTheme = options.theme
            this.jdom = {};
            this.events = $.extend({}, options.events);
        },
        render: function() {
            $('body').append(mainTpl);
            this.el = $('body>div.index_setting');
            this._bindEvent();
            return this;
        }
    };


    //绑定页面事件
    IndexSetting.prototype._bindEvent = function() {
        var _this = this;
        //显示设置面板
        $('#header_setting>a').on('click', function() {
            _this.el.addClass('unfold');
        });
        //隐藏设置面板
        this.el.find('.setting_close').add('.index_setting_shadow').on("click", function(){
            _this.el.removeClass('unfold');
        })
        //默认加载主题选中
        if(this.currentTheme){
            var domTheme = this.el.find('a.theme')
            domTheme.each(function(){
                if($(this).attr('class') == 'theme ' + _this.currentTheme){
                    $(this).addClass('active')
                }
            })
            console.log();
        }

        //切换主题
        this.el.find('a.theme').on('click', function() {
            var theme = 'blue';
            if ($(this).hasClass('orange')) {
                theme = 'orange';
            }
            $(this).addClass('active').parents().siblings().find('.theme').removeClass('active')
            _this.indexToolBar._changeTheme(theme, true);
            return false;

        });

    };

    module.exports = IndexSetting;
});
