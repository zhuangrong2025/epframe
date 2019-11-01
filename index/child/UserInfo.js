define(function(require, exports, module) {
    var $ = require('jquery'),
        baseComm = require('base-common-module'),
        xyzAlert = require('xyz-alert'),
        shineForm = require('shine-form'),
        ShineValidator = require('shine-validator');

    require('xyz-jsonRPC')($);
    require('../../public/common/ESYS');

    //模板引入
    var mainTpl = require('./template/UserInfoMain.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        LOAD_USER_INFO: SERVICE_GATEWAY + 'epframe.epbos_userManageService.getMyUserInfo',
        SAVE_USER_INFO: SERVICE_GATEWAY + 'epframe.epbos_userManageService.updateMyUserInfo'
    };

    var UserInfo = function(options) {
        this.initialize(options);
    };

    UserInfo.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            //从缓存读取用户信息
            this.userInfo = baseComm.getUser();
            this.formValidator;
        },
        render: function() {
            this.el.html(mainTpl);
            this._init();
        }
    };

    //初始化
    UserInfo.prototype._init = function() {
        var _this = this;
        this.form = $('#form');
        this._loadUserInfo();
        //修改联系电话格式--临时解决方案
        $.validator && $.validator.addMethod("isTel", function(value, element) {
            var mobile = /^1[3456789]\d{9}$/;
            var tel = /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,8}$/;
            return this.optional(element) || tel.test(value) || mobile.test(value);
        }, "请正确填写您的电话号码");
        this.formValidator = new ShineValidator({
            el: _this.form,
            rules: {
                id_card: 'isIdCardNo',
                tel: 'isTel',
                mobile: 'isMobile',
                email: 'email'
            }
        });
        this._bindEvent();
    };

    UserInfo.prototype._loadUserInfo = function() {
        var _this = this;
        $.jsonRPC.request(service.LOAD_USER_INFO, {
            params: {
                params: {}
            },
            success: function(response) {
                _this.data = response.data;
                shineForm.setValue(_this.form, _this.data, true);
            },
            error: function(response) {
                xyzAlert.error('获取用户信息出错，请重新访问该页面!');
                window.console && console.log('获取用户信息出错', response);
            }
        });
    };

    UserInfo.prototype._saveUserInfo = function(callback) {
        var _this = this;
        if (this.formValidator.form()) {
            var data = shineForm.getValue(_this.form);
            $.jsonRPC.request(service.SAVE_USER_INFO, {
                params: {
                    params: data
                },
                success: function(response) {
                    _this.data = data;
                    shineForm.setValue(_this.form, data, true);
                    xyzAlert.success('用户信息修改成功!');
                    callback();
                },
                error: function(response) {
                    xyzAlert.error(response.message ? response.message : '用户信息修改失败!');
                    window.console && console.log('用户信息修改失败', response);
                }
            });
        }
    };

    UserInfo.prototype._bindEvent = function() {
        var _this = this;

        $('#editBtn').on('click', function() {
            shineForm.setValue(_this.form, _this.data);
            shineForm.startEdit(_this.form);
        });

        $('#saveBtn').on('click', function() {
            _this._saveUserInfo(function() {
                _this.formValidator.resetForm();
                shineForm.stopEdit(_this.form);
            });
        });

        $('#cancelBtn').on('click', function() {
            _this.formValidator.resetForm();
            shineForm.stopEdit(_this.form);
        });
    };

    module.exports = UserInfo;
})