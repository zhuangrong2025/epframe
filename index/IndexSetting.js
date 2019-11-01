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
            this.events = $.extend({}, options.events);
        },
        render: function() {
            $('body').append(mainTpl);

        }
    };

    //绑定页面事件
    IndexSetting.prototype._bindEvent = function() {
        var _this = this;
        
    };

    module.exports = IndexSetting;
});
