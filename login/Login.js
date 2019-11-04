define(function(require, exports, module) {
    var $ = require('jquery');
    require('./Login.css');
    //引入模块
    var xyzAlert = require('xyz-alert'),
        sm4Pad = require('../public/lib/sm4Pad'),
        Storage = require('xyz-storage'),
        mainTpl = require('./template/Main.html');
    //页面跳转参数
    var loginIndex = './Login.html',
        service = '/EPSERVICERUN/pages/USAccess/sendRedirect.do',
        lt = '',
        _eventId = 'submit';

    //定义
    var Login = function(options) {
        this.initialize(options);
    };


    Login.prototype = {
        initialize: function(options) {
            this.el = options.el;
        },
        render: function() { //渲染
            $(this.el).html(mainTpl);
            this._init();
        }
    };

    //初始化
    Login.prototype._init = function() {
        this._getLt();
        this._bindEvent();
    }

    //事件定义
    Login.prototype._bindEvent = function() {
        //点击登录按钮触发
        this._signIn();

    };

    Login.prototype._signIn = function() {
        var _this = this;
        $('#btn_sign_in').on('click', function() {
            var username = $('#username_temp').val().replace(/\s+/g,"");
            var password = $('#password').val().replace(/\s+/g,"");
            if( username.length == 0 ){
            	xyzAlert.info('用户名不能为空!')
            	$('#username_temp').focus();
            	return false;
            }
            if ( password.length == 0 ){
            	xyzAlert.info('密码不能为空!');	
            	$('#password').focus();
            	return false;
            } 
            _this._doLogIn(username,password);
        }); 
        $(document).keydown(function(event) {　
            if(event.keyCode == 13) {
                var username = $('#username_temp').val().replace(/\s+/g,"");
                var password = $('#password').val().replace(/\s+/g,"");
                if( username.length == 0 ){
                	xyzAlert.info('用户名不能为空!')
                	$('#username_temp').focus();
                	return false;
                }
                if ( password.length == 0 ){
                	xyzAlert.info('密码不能为空!');	
                	$('#password').focus();
                	return false;
                } 
                _this._doLogIn(username,password);
              
            }　
        });
    }
    Login.prototype._doLogIn = function(username,password) {
            var _this = this;
           
            //取得密钥
            $.ajax({
                url: '/cas/cstlogin',
                type: 'post',
                dataType: 'text',
                data: {
                    username: username + '_' + $('#APP_ID').val(),
                    password:  sm4Pad.Encrypt(username,password),
                    loginIndex: loginIndex,
                    service: service,
                    lt: lt,
                    _eventId: _eventId
                },
                success: function(data) {
                    var ret = $.parseJSON(data);
                    if ('1' == ret.retCode) {
                        window.location.href = ret.service; //验证用户名密码成功，跳转到首页
                    } else if ('2' == ret.retCode) {
                        window.location.href = service;
                    } else {
                        xyzAlert.info(ret.retMsg, { //验证用户名密码失败，弹出alert
                            closeOnConfirm: true,
                            confirmButtonText: '确定',
                            confirm: function() {
                                $('#lt').val(ret.lt);
                                $('#password').val("");
                            }
                    }, '');


                    }
                }
            });
        }
        //获取token
    Login.prototype._getLt = function() {

        $.ajax({
            url: '/cas/cstlogin',
            type: 'get',
            success: function(data) {
                var d = $.parseJSON(data);
                if ('0' == d.retCode) {
                    lt = d.lt;
                } else if ('2' == d.retCode) {
                    window.location.href = service; //登录成功的情况下，再登录直接跳转到首页
                } else {
                    xyzAlert.error(d.retMsg);
                }
            }
        });
    }

    module.exports = Login;
});