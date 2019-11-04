define(function (require, exports, module) {
    var $ = require('jquery'),
        baseComm = require('base-common-module'),
        XyzAlert = require('xyz-alert'),
        ShineValidator = require('shine-validator'),
        sm4Pad = require('../../../public/lib/sm4Pad'),
        mainTpl = require('./template/ResetPwd.html');   
        require('xyz-jsonRPC')($);
    //模板引入
    var service = function() {
        var JSON_BASE = '/EPSERVICERUN/json/USAccess/json.do?service=',
            TABLE_BADE = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';
        function getJsonURL(servUrl) {
            return JSON_BASE + servUrl;
        }
        function getTableURL(servUrl) {
            return TABLE_BADE + servUrl;
        }
        return {
            RESET_PWD : getJsonURL('epcum.epbos_userManageService.resetPwd')
        }
    }();



    var ResetPwd = function (options) {
        this.initialize(options);
    };
    ResetPwd.prototype = {
        initialize: function (options) {
            this.el = options.el;
            this.dialog = options.dialog;
            this.userCode = options.user_code;
        },
        render: function () {
            $(this.el).html(mainTpl);
            this._init();
        },
        dispose: function () {
        },
        refresh: function () {
        }
    };

    //初始化
    ResetPwd.prototype._init = function() {
  
        this.formValidator = new ShineValidator({
            el: '#form',
            rules: {
                reset_user_pwd: {
                    equalTo: '#new_user_pwd'
                }
            },
            messages: {
                reset_user_pwd: {
                    equalTo: '重置缺省密码和确认密码不同'
                }
            }
        });
        //this._bindEvent();
    };
    
    /*
     * 保存数据, dialog组件会调用该方法. 
     * cb为回调函数，保存成功后调用cb关闭对话框.
     */
    ResetPwd.prototype.save = function(cb) {
        _this = this;
        var resetUserPwd = $('#reset_user_pwd').val();
        var newUserPwd  = $('#new_user_pwd').val();
        if (_this.formValidator.form()){
            XyzAlert.info("确认重置该用户密码?", {
                showCancelButton: true,
                closeOnConfirm: true,
                closeOnCancel: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                confirm: function() {
                    var userInfo = baseComm.getUser();
                    var userCode = userInfo.user_code;        
                    $.jsonRPC.request(service.RESET_PWD, {
                        params: {
                            params: {
                                user_code: _this.userCode,
                                reset_user_pwd:sm4Pad.Encrypt(userCode,resetUserPwd)
                            }
                        },
                        success: function(response) {
                            XyzAlert.info('修改成功！');
                            cb && cb();
                        }
                    });               
                }
            });
        }

    };       
    module.exports = ResetPwd;
});