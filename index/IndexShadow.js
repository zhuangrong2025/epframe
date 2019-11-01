define(function(require, exports, module) {

    var $ = require('jquery');

    //模板引入
    var shadowTpl = '<div class="index_shawdow">' +
                    '    <div class="shawdow_bg"></div>' +
                    '    <div class="shawdow_bx"></div>' +
                    '</div>';

    function IndexShadow(options) {
        this.initialize(options);
    };

    IndexShadow.prototype = {
        initialize: function(options) {
            this.globalShadow;
        },
        render: function() {}
    };

    //展示全局遮罩
    IndexShadow.prototype.showGlobalShadow = function(delay, customRender) {
        if (!this.globalShadow) {
            var shadow = $('body>div.index_shawdow');
            if (0 == shadow.size()) {
                this.globalShadow = $(shadowTpl).hide();
                $('body').append(this.globalShadow);
            } else {
                this.globalShadow = shadow;
            }
        }
        if ($.isFunction(customRender)) {
            customRender(this.globalShadow.find('.shawdow_bx'));
        }
        this.globalShadow.show();
        var _this = this;
        if ($.isNumeric(delay)) {
            setTimeout(function() {
                _this.hideGlobalShadow();
            }, dalay);
        }
    };

    //隐藏全局遮罩
    IndexShadow.prototype.hideGlobalShadow = function() {
        if (this.globalShadow) {
            this.globalShadow.hide();
        }
    };

    module.exports = IndexShadow;
});