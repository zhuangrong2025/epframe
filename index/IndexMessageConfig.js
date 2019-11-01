define(function(require, exports, module) {

    var $ = require('jquery'),
        xyzAlert = require('xyz-alert'),
        XyzSelect = require('xyz-select2'),
        XyzSwitch = require('xyz-bootstrap-switch');

    //模板引入
    var mainTpl = require('./template/IndexMessageConfig.html');

    //常量
    var DEFAULT_CONFIG = {
        is_enabled: '0',
        tone: '1',
        data_range: 0
    };

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        GET_USER_SETTING: SERVICE_GATEWAY + 'epframe.epbos_messageService.getUserSetting',
        SET_USER_SETTING: SERVICE_GATEWAY + 'epframe.epbos_messageService.setUserSetting'
    };

    function IndexMessageConfig(options) {
        this.initialize(options);
    };

    IndexMessageConfig.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.jdom = {};
            this.events = $.extend({
                close: function(action) {},
                change: function(config) {}
            }, options.events);
            this.config = DEFAULT_CONFIG;
        },
        render: function() {
            this.el.html(mainTpl);
            this._init();
            return this;
        }
    };

    //初始化
    IndexMessageConfig.prototype._init = function() {
        this._createForm();
        this._bindEvent();

    };

    IndexMessageConfig.prototype._getUserSetting = function(callback) {
        var _this = this;
        $.jsonRPC.request(service.GET_USER_SETTING, {
            params: {
                params: {}
            },
            success: function(response) {
                var data = response.data;
                _this.config.is_enabled = (null != data && undefined !== data.is_enabled) ? data.is_enabled : DEFAULT_CONFIG.is_enabled;
                _this.config.tone = (null != data && undefined !== data.tone) ? data.tone : DEFAULT_CONFIG.tone;
                _this.config.data_range = (null != data && undefined !== data.data_range) ? data.data_range : DEFAULT_CONFIG.data_range;
                $.isFunction(callback) && callback($.extend({}, _this.config));
            },
            error: function(response) {
                xyzAlert.error('页面出错，请重新访问该页面!');
                window.console && console.log('页面出错', response);
            }
        });
    };

    IndexMessageConfig.prototype._setUserSetting = function(config, callback) {
        $.jsonRPC.request(service.SET_USER_SETTING, {
            params: {
                params: {
                    'msg_user_setting': config
                }
            },
            success: function(response) {
                if ($.isFunction(callback)) {
                    callback(true);
                }
            },
            error: function(response) {
                xyzAlert.error('页面出错，请重新访问该页面!');
                window.console && console.log('页面出错', response);
                if ($.isFunction(callback)) {
                    callback(false);
                }
            }
        });
    };

    IndexMessageConfig.prototype._createForm = function() {
        this.mainSwitch = new XyzSwitch({
            el: "#message_mainSwitch",
            name: 'message_mainSwitch',
            onText: '是', //状态为打开时文本
            offText: '否', //状态为关闭时文本
            state: false, //默认状态，true为开，false为关.   默认为true
            events: {
                change: function(val, m, state) { //val为开关状态，m为实例， state为是否为人为点击
                    m.setValue(val);
                }
            }
        })
        this.mainSwitch.render();

        this.voiceSwitch = new XyzSwitch({
            el: "#message_voiceSwitch",
            name: 'message_voiceSwitch',
            onText: '是', //状态为打开时文本
            offText: '否', //状态为关闭时文本
            state: true, //默认状态，true为开，false为关.   默认为true
            events: {
                change: function(val, m, state) { //val为开关状态，m为实例， state为是否为人为点击
                    m.setValue(val);
                }
            }
        })
        this.voiceSwitch.render();

        this.soundSelect = new XyzSelect({
            el: '#message_sound',
            name: 'user_group',
            placeholder: "请选择",
            allowClear: false,
            ajax: {
                list: [
                    { 'code': '1', 'text': '铃声1' },
                    { 'code': '2', 'text': '铃声2' }
                ],
                id: "code",
                text: "text"
            }

        });
        this.soundSelect.render();

        this.durationSelect = new XyzSelect({
            el: '#message_duration',
            name: 'message_duration',
            placeholder: "请选择",
            allowClear: false,
            ajax: {
                list: [
                    { 'code': 0, 'text': '当天' },
                    { 'code': 2, 'text': '近3天' },
                    { 'code': 6, 'text': '近7天' },
                    { 'code': 14, 'text': '近15天' },
                    { 'code': 29, 'text': '近30天' }
                ],
                id: "code",
                text: "text"
            }

        });
        this.durationSelect.render();
    };

    IndexMessageConfig.prototype._getConfig = function() {
        var config = {
            is_enabled: this.mainSwitch.getValue() == false ? '0' : '1',
            tone: this.voiceSwitch.getValue() == false ? '0' : this.soundSelect.getValue(),
            data_range: this.durationSelect.getValue()
        };
        return config;
    };

    //-----------------------

    IndexMessageConfig.prototype.prepareUserSetting = function() {
        var _this = this;
        this._getUserSetting(function(config) {
            _this.mainSwitch.setValue(config.is_enabled == '0' ? false : true);
            _this.voiceSwitch.setValue(config.tone == '0' ? false : true);
            _this.soundSelect.setValue(config.tone == '0' ? '1' : config.tone);
            _this.durationSelect.setValue(config.data_range);
        });
    };

    IndexMessageConfig.prototype.getUserSetting = function(callback) {
        this._getUserSetting(callback);
    };

    //-----------------------

    //绑定页面事件
    IndexMessageConfig.prototype._bindEvent = function() {
        var _this = this;

        //取消设置
        this.el.find('button[role=cancel]').on('click', function() {
            if ($.isFunction(_this.events.close)) {
                _this.events.close('cancel');
            }
        });

        //保存设置
        this.el.find('button[role=save]').on('click', function() {
            if ($.isFunction(_this.events.close)) {
                _this.events.close('save');
            }
            var config = _this._getConfig();
            if (config.is_enabled != _this.config.is_enabled ||
                config.tone != _this.config.tone ||
                config.data_range != _this.config.data_range) {
                _this._setUserSetting(config, function(res) {
                    if (res) {
                        _this.config = config;
                        if ($.isFunction(_this.events.change)) {
                            _this.events.change(_this.config);
                        }
                    }
                });
            }
        });
    };

    module.exports = IndexMessageConfig;
});