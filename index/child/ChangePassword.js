define(function(require, exports, module) {
    var $ = require('jquery'),
        xyzAlert = require('xyz-alert'),
        shineForm = require('shine-form'),
        baseComm = require('base-common-module'),
        sm4Pad = require('../../public/lib/sm4Pad'),
        _ = require('lodash'),
        ShineValidator = require('shine-validator');

    require('xyz-jsonRPC')($);
    require('../../public/common/ESYS');

    //模板引入
    var mainTpl = require('./template/ChangePasswordMain.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        CHANGE_PASSWORD: SERVICE_GATEWAY + 'epframe.epbos_userManageService.updatePwd'
    };

    var ChangePassword = function(options) {
        this.initialize(options);
    };

    ChangePassword.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
        },
        render: function() {
            this.el.html(mainTpl);
            this._init();
        }
    };

    //初始化
    ChangePassword.prototype._init = function() {
        this.formValidator = new ShineValidator({
            el: '#form',
            rules: {
                newPwd2: {
                    equalTo: '#new_user_pwd'
                }
            },
            messages: {
                newPwd2: {
                    equalTo: '新密码和确认密码不同'
                }
            }
        });
        this._bindEvent();
    };

    ChangePassword.prototype._bindEvent = function() {
        var _this = this;
        
        $('#saveBtn').on('click', function() {
            var userInfo = baseComm.getUser();
            var userCode = userInfo.user_code;
            var old_user_pwd =sm4Pad.Encrypt(userCode,$("#old_user_pwd").val());
            var new_user_pwd =sm4Pad.Encrypt(userCode,$("#new_user_pwd").val());
            var pwdJson = {'old_user_pwd' :old_user_pwd,'new_user_pwd':new_user_pwd}
            if (_this.formValidator.form()) {
                $.jsonRPC.request(service.CHANGE_PASSWORD, {
                    params: {
                        params: pwdJson
                    },
                    success: function(response) {
                        $(':password').val('');
                        xyzAlert.success('修改密码成功！');
                    },
                    error: function(response) {
                        xyzAlert.error(response.message ? response.message : '修改密码失败，请重试！');
                    }
                });
            }
        });

        $('#cancelBtn').on('click', function() {
            _this.formValidator.resetForm();
            $(':password').val('');
        });
    };

    module.exports = ChangePassword;
})