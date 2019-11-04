define(function(require, exports, module) {
    var $ = require('jquery');
    require('./Init.css');
    //引入模块
    var xyzAlert = require('xyz-alert'),
        baseCommon = require('base-common-module'),
        shineForm = require('shine-form'),
        xyzAlert = require('xyz-alert'),
        ShineValidator = require('shine-validator'),
        sm4Pad = require('../public/lib/sm4Pad'),
        mainTpl = require('./template/Main.html')
        ESYS = require('../public/common/ESYS');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/AnonUSAccess/json.do?service=';

    //服务网关地址
    var service = {
        GET_USERS_QUANTITY: SERVICE_GATEWAY + 'epframe.epbos_userManageService.getUserQuantity',
        SET_ADMIN: SERVICE_GATEWAY + 'epframe.epbos_userManageService.addAdmin',
        GET_LOGIN_URL: SERVICE_GATEWAY + 'epframe.epbos_systemInfoService.getLoginUrl'
    };
    //定义
    var Init = function(options) {
        this.initialize(options);
    };


    Init.prototype = {
        initialize: function(options) {
            this.el = options.el;
        },
        render: function() { //渲染
            $(this.el).html(mainTpl);
            this._init();
            this._createFormValidate();
        }
    };

    //创建表单验证器
    Init.prototype._createFormValidate = function() {
        $('#username').attr({
            'minlength': 5,
            'maxlength': 30
        });
        $('#password').attr({
            'minlength': 8,
            'maxlength': 30
        });
        this.formValidator = new ShineValidator({
            el: '#createUserForm',
            rules: {
                username: {
                    required: true,
                    isAlnum: true
                },
                password: {
                    required: true,
                    isAlnum: true
                },
                password2: {
                    required: true,
                    isAlnum: true,
                    custom: {
                        context: this,
                        dependency: function(nextHandler, value, element) {
                            if ($("#password").val() != value) {
                                nextHandler('两次输入的密码不一致！');
                            }
                        }
                    }
                }
            },
            messages: {
                username: {
                    isAlnum: '非数字和字母组合'
                },
                password: {
                    isAlnum: '非数字和字母组合'
                }
            }
        });
    };

    //初始化
    Init.prototype._init = function() {
        //  this._getLt();
        this._bindEvent();
    }

    //事件定义
    Init.prototype._bindEvent = function() {
        _this = this;
        //添加部门
        $('#btn-create').on('click', function() {
            if (_this.formValidator.form()) {
                _this._validateUser($("#username").val(), $("#password").val());
            }
        });
    };

    //验证部门代码是否已经存在
    Init.prototype._validateUser = function(username, userpwd) {
        //获取数据库用户数量，判断是否大于0
        $.jsonRPC.request(service.GET_USERS_QUANTITY, {
            params: {
                params: {}
            },
            async: false,
            success: function(response) {
                if (response.data >= 1) {
                    xyzAlert.info('系统管理员用户已创建， 不允许重复创建!', {
                        showCancelButton: false,
                        closeOnConfirm: false,
                        confirmButtonText: '确定',
                        confirm: function() {
                            window.location.href = ESYS.formaturl('/EPWEBRUN/');
                            //获取登录地址
                            /* $.jsonRPC.request(service.GET_LOGIN_URL, {
                                params: {
                                    params: {}
                                },
                                async: false,
                                success: function(response) {
                                    window.location.href = '../../../../' + response.data;
                                },
                                error: function() {
                                    xyzAlert.error("登录页地址获取失败,请重试");
                                }
                            }); */
                        }
                    }, '');
                } else {
                    //插入管理员登录账号和密码
                    $.jsonRPC.request(service.SET_ADMIN, {
                        params: {
                            params: {
                                user_code: username,
                                user_pwd: sm4Pad.Encrypt(username,userpwd),
                            }
                        },
                        async: false,
                        success: function(response) {
                            xyzAlert.info('系统管理员创建成功！', {
                                showCancelButton: false,
                                closeOnConfirm: true,
                                confirmButtonText: '确定',
                                confirm: function() {
                                   window.location.href = ESYS.formaturl('/EPWEBRUN/');
                                }
                            }, '');
                            //获取登录地址
                            /* $.jsonRPC.request(service.GET_LOGIN_URL, {
                                params: {
                                    params: {}
                                },
                                async: false,
                                success: function(response) {
                                    xyzAlert.info('系统管理员创建成功！', {
                                        showCancelButton: false,
                                        closeOnConfirm: true,
                                        confirmButtonText: '确定',
                                        confirm: function() {
                                            window.location.href = '../../../../' + response.data;
                                        }
                                    }, '');

                                },
                                error: function() {
                                    xyzAlert.error("登录页地址获取失败,请重试");
                                }
                            }); */
                        },
                        error: function() {
                            xyzAlert.error('创建系统管理员用户失败，请重试');
                        }
                    });
                }
            },
            error: function() {
                xyzAlert.error('创建系统管理员用户失败，请重试');
            }
        })



    };


    module.exports = Init;
});