define(function(require, exports, module) {

    var $ = require('jquery'),
        _ = require('lodash'),
        observer = require('observer'),
        xyzAlert = require('xyz-alert'),
        Websocket = require('xyz-websocket'),
        IndexMessageConfig = require('./IndexMessageConfig'),
        IndexMessageSummary = require('./IndexMessageSummary');
        
    //模板引入
    var mainTpl = require('./template/IndexMessage.html');

    //常量
    var IS_ENABLED_ON = '1',
        MSG_IS_READED_FLAG_NONE = '0';

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        QUERY_MSG: SERVICE_GATEWAY + 'epframe.epbos_messageService.queryMsg',
        GET_MSG_INFO: SERVICE_GATEWAY + 'epframe.epbos_messageService.getMsgInfo'
    };

    function IndexMessage(options) {
        this.initialize(options);
    };

    IndexMessage.prototype = {
        initialize: function(options) {
            this.jdom = {};
            this.cache = {};
            this.events = $.extend({}, options.events);
            this.config = null;
            this.websocketFlag = false;
            this.toneEle = null;
        },
        render: function() {
            $('body').append(mainTpl);
            this.el = $('body>div.index_notice');
            this._init();
            return this;
        }
    };

    //初始化
    IndexMessage.prototype._init = function() {
        var _this = this,
            jdom = this.jdom;

        jdom.header = this.el.find('div.nt-header');
        jdom.setting = this.el.find('div.nt-setting');
        jdom.summary = this.el.find('div.nt-summary');
        jdom.content = this.el.find('div.nt-content');
        jdom.contentTitle = jdom.content.find('>h3>span');
        jdom.contentTime = jdom.content.find('>h3>em');
        jdom.contentInfo = jdom.content.find('>div.nt-content-info');
        jdom.contentAttach = jdom.content.find('>div.nt-attachment>ul');
        jdom.messageShadow = $('body>div.index_notice_shadow');
        jdom.messageNumber = $('#header_number');

        //create indexMessageConfig
        this.indexMessageConfig = new IndexMessageConfig({
            el: jdom.setting,
            events: {
                close: function(action) {
                    _this.jdom.setting.css('overflow', 'hidden');
                    _this.el.removeClass('config');
                },
                change: function(config) {
                    _this._switchChannel(config);
                }
            }
        }).render();

        //create indexMessageSummary
        this.indexMessageSummary = new IndexMessageSummary({
            el: jdom.summary,
            events: {
                chooseMessage: function(item) {
                    _this._getMsgInfo(item.msg_id);
                    _this.el.addClass('unfold');
                },
                updateMessageCounter: function(counter) {
                    var count = (counter.disread > 99) ? '99+' : counter.disread;
                    _this.jdom.messageNumber.html(count);
                }
            }
        }).render();

        this._bindEvent();
        this._prepareChannel();

        //this._debug();
    };

    IndexMessage.prototype._debug = function() {
        $('body').append(
            '<div id="ctl">' +
            '    <button type="button">发送消息</button><br>' +
            '    <input type="text" value="标题" id="msgTitle" /><br>' +
            '    <input type="text" value="内容" id="msgContent" /><br>' +
            '</div>');
        $('#ctl').css({
            'position': 'fixed',
            'top': '0',
            'left': '30%',
            'z-index': '999999999'
        }).find('>button').on('click', function() {
            $.jsonRPC.request('/EPSERVICERUN/json/USAccess/json.do?service=epframe.epbos_messageService.addMsg', {
                params: {
                    params: {
                        msg_info: {
                            msg_type: "",
                            user_code: "admin123",
                            dept_id: 1000,
                            msg_title: $('#msgTitle').val(),
                            content: $('#msgContent').val() + ' ' + (new Date().getTime()),
                            attach_count: ""
                        },
                        receivers: ["admin123"]
                    }
                },
                success: function(response) {
                    console.log('发送消息成功');
                },
                error: function(response) {
                    console.log('发送消息失败', response);
                }
            });
        });
    };

    //消息预处理
    IndexMessage.prototype._preprocessMessage = function(message) {
        message.is_readed = MSG_IS_READED_FLAG_NONE;
    };

    //获取所有消息
    IndexMessage.prototype._getAllMessages = function(range) {
        var _this = this;
        $.jsonRPC.request(service.QUERY_MSG, {
            params: {
                params: {
                    days: range
                }
            },
            success: function(response) {
                var data = response.data;
                _this.indexMessageSummary.setMessages(data);
            },
            error: function(response) {
                xyzAlert.error('页面加载出错，请重新访问该页面!');
                window.console && console.log('获取登录信息出错', response);
            }
        });
    };

    IndexMessage.prototype._prepareChannel = function() {
        var _this = this;
        observer.on('index:loadMessageContext', function() {
            _this.indexMessageConfig.getUserSetting(function(config) {
                _this._switchChannel(config);
            });
        });
        observer.on('xyz-websocket:sysmsg', function(data) {
            if (_this.config && _this.config.is_enabled == IS_ENABLED_ON) {
                _this._preprocessMessage(data);
                _this.indexMessageSummary.addMessages(data);
                if(_this.config.tone!=='0'){
                    _this._alertingTone();
                }
            }
        });
    };

    IndexMessage.prototype._alertingTone = function(){
        var _this = this;
        if(this.toneEle){
            this.toneEle.setAttribute('src', '../../assets/business/tone/'+ (_this.config && _this.config.tone || 1) + '.mp3');
        }else{
            $audio = $('<audio id="systemToneAudio" controls="controls" muted="muted" loop hidden="true"></audio>');
            $audio.attr('src', '../../assets/business/tone/'+ (_this.config && _this.config.tone || 1) + '.mp3');
            $audio.appendTo('body');
            this.toneEle = document.getElementById('systemToneAudio')
        }
        
        this.toneEle.play();
        this.toneEle.muted = false;
    };

    IndexMessage.prototype._stopAlertingTone = function(){
        if(this.toneEle && this.toneEle!==null){
            if(!this.toneEle.paused){
                this.toneEle.pause();
            }
        }
    };

    IndexMessage.prototype._switchChannel = function(config) {
        var _this = this;
        _this.config = config;
        if (_this.config.is_enabled == IS_ENABLED_ON) {
            _this.jdom.messageNumber.show();
            _this._getAllMessages(_this.config.data_range);
            if (false == _this.websocketFlag) {
                Websocket({
                    app_id: '0',
                    protocol: _.startsWith(window.location.href, 'https:') ? 'wss' : 'ws',
                    registerServices: 'sysmsg'
                });
                _this.websocketFlag = true;
            }
        } else {
            _this.jdom.messageNumber.hide();
            _this.indexMessageSummary.turnOff();
        }
    };

    //获取消息详情
    IndexMessage.prototype._getMsgInfo = function(msgId) {
        var _this = this;
        $.jsonRPC.request(service.GET_MSG_INFO, {
            params: {
                params: {
                    msg_id: parseInt(msgId)
                }
            },
            success: function(response) {
                var data = response.data;
                _this.jdom.contentTitle.html(data.msg_title);
                _this.jdom.contentTime.html(_this._convertDate(data.create_time));
                _this.jdom.contentInfo.html('<p>' + data.content + '</p>');
            },
            error: function(response) {
                xyzAlert.error('获取消息详情出错，请重新点击该项!');
                window.console && console.log('获取消息详情出错', response);
            }
        });
    };

    IndexMessage.prototype._convertDate = function(date) {
        var day = new Date();
        day.setTime(date);
        var yy = day.getFullYear(),
            mo = (1 + day.getMonth()),
            dd = day.getDate(),
            hh = day.getHours(),
            mm = day.getMinutes();
        return yy + '-' + (mo < 10 ? '0' + mo : mo) + '-' + (dd < 10 ? '0' + dd : dd) +
            ' ' + (hh < 10 ? '0' + hh : hh) + ':' + (mm < 10 ? '0' + mm : mm);
    };

    //-----------------------



    //-----------------------

    //绑定页面事件
    IndexMessage.prototype._bindEvent = function() {
        var _this = this;

        //显示消息盒子
        $('#header_message>a').on('click', function() {
            _this.el.addClass('small');
            _this._stopAlertingTone();
            return false;
        });
        //收缩消息盒子
        this.jdom.header.find('em[role=fold]').on('click', function() {
            _this.el.removeClass('unfold');
            return false;
        });
        //打开设置
        this.jdom.header.find('i[role=setting]').on('click', function() {
            if (_this.el.hasClass('config')) {
                _this.jdom.setting.css('overflow', 'hidden');
                _this.el.removeClass('config');
            } else {
                _this.el.addClass('config');
                _this.configTimer && clearTimeout(_this.configTimer);
                _this.configTimer = setTimeout(function() {
                    if (_this.el.hasClass('config')) {
                        _this.jdom.setting.css('overflow', 'visible'); //解决下拉框选项遮挡
                    }
                }, 300);
                _this.indexMessageConfig.prepareUserSetting();
            }
            return false;
        });
        //关闭设置
        this.jdom.header.find('i[role=close]')
            .add(this.jdom.messageShadow).on('click', function() {
                _this.el.removeClass('small').removeClass('unfold');
                _this.jdom.setting.css('overflow', 'hidden');
                _this.el.removeClass('config');
                return false;
            });
    };

    module.exports = IndexMessage;
});