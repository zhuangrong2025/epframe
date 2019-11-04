define(function(require, exports, module) {
    var _ = require('lodash'),
        $ = require('jquery'),
        Observer = require('observer'),
        XyzAlert = require('xyz-alert'),
        XyzSelect = require('xyz-select2'),
        XyzBootstrapSwitch = require('xyz-bootstrap-switch'),
        FormHelper = require('shine-form'),
        ShineLoaddict = require('shine-loaddict'),
        ShineValidator = require('shine-validator'); //引入表单校检器;

    var tpl = require('./template/UserInfo.html');

    var DATATABLES_GATEWAY = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';
    var service = {
        GET_USER_INFO: SERVICE_GATEWAY +
            'epcum.epbos_userManageService.getUserInfo',
        UPDATE_USER_INFO: SERVICE_GATEWAY +
            'epcum.epbos_userManageService.updateUserInfo',
    };

    var UserInfo = function(options) {
        this.initialize(options);
    };

    UserInfo.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.user_code = options.user_code;
            this.user_status = options.user_status;
        },
        render: function() {
            $(this.el).html(tpl);
            //用户状态为注销、冻结、挂起的 不能编辑
            if(this.user_status!=='0'){
                $(this.el).find('.btn-edit').attr('disabled', true);
            }
            //设置只读状态的用户信息
            // ShineLoaddict.load('USER_GROUP');
            this._createForm();
            this._initValidator();
            this._initEvents();
            this._getUserInfo();

        },
        dispose: function() {},
        refresh: function() {}
    };

    //获取用户信息
    UserInfo.prototype._getUserInfo = function() {
        var _this = this;
        $.jsonRPC.request({
            url: service.GET_USER_INFO,
            params: {
                params: {
                    user_code: _this.user_code
                }
            },
            success: function(response) {
                _this.data = response.data;
                _this.oldData =   _this.data ;//保存原始数据，“取消”事件，复原表单
                _this._setFormValue();
            }
        });
    }

    //创建用户下次登录修改密码开关
    UserInfo.prototype._createForm = function() {
        var _this = this;
        _this.switchON = new XyzBootstrapSwitch({
            el: "#IS_UPDATE_PWD",
            name: 'is_update_pwd',
            onText: '是', //状态为打开时文本
            offText: '否', //状态为关闭时文本
            state: true, //默认状态，true为开，false为关.   默认为true
            events: {
                change: function(val, m, state) { //val为开关状态，m为实例， state为是否为人为点击
                    m.setValue(val);
                    //_.assign(_this.data, {is_always_valid: val});
                }
            }
        })
        _this.switchON.render();
        //创建密码永不过期开关

        _this.passwordExpire = new XyzBootstrapSwitch({
            el: "#IS_ALWAYS_VALID",
            name: 'is_always_valid',
            onText: '是', //状态为打开时文本
            offText: '否', //状态为关闭时文本
            state: true, //默认状态，true为开，false为关.   默认为true
            events: {
                change: function(val, m, state) { //val为开关状态，m为实例， state为是否为人为点击
                    m.setValue(val);
                  //开启“密码有效天数”输入框
                    $("#div_period_of_validity_id").css("display", "");
                    if (val){
                    	$("#period_of_validity_id").val("");
                 	   $("#period_of_validity_id").attr("readonly","readonly");
                    }else{
                 	   $("#period_of_validity_id").removeAttr("readonly");
                    }
                }
            }
        })
        _this.passwordExpire.render();
        //创建用户组下拉框
        this.userGroupSelect = new XyzSelect({
            el: '#USER_GROUP_ID',
            name: 'user_group',
            placeholder: "请选择",
            allowClear: false,
            required: true,
            ajax: {
                list: [
                    {'code': '2', 'text': '部门管理员'},
                    {'code': '3', 'text': '普通用户' }
                ],
                id: "code",
                text: "text"
            }

        });
        this.userGroupSelect.render();
    };

    //创建表单验证器
    UserInfo.prototype._initValidator = function() { 
        $('#id_email').attr({ 
            'maxlength': this.emialLen
        });
        //修改联系电话格式--临时解决方案
        $.validator && $.validator.addMethod("isTel", function(value, element) {
            var mobile = /^1[3456789]\d{9}$/;
            var tel = /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,8}$/;
            //var tel = /^(((\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,8})|(1[3456789]\d{9}))$/;
            return this.optional(element) || tel.test(value) || mobile.test(value);
        }, "请正确填写您的电话号码");
        this.userFormValidator = new ShineValidator({
            el: '#userForm',
            rules: {
                id_card:{
                    isIdCardNo:true
                },
                period_of_validity: {  
                    isNum: true  
                },
                tel: {
                    isTel: true 
                },
                mobile: {
                    isMobile: true 
                },
                email: {
                    email: true 
                }
            }
        });
    }

    //角色更新
    UserInfo.prototype._save = function() {
        _this = this;
        if (!_this.userFormValidator.form()) { //表单检验不通过
            return false;
        }
        _this.data = FormHelper.getValue('#userForm'),
            _.assign(_this.data, {
                is_update_pwd: _this.switchON.getValue() == false ? '0' : '1',
                is_always_valid : _this.passwordExpire.getValue() == false ? '0' : '1',
                user_group: _this.userGroupSelect.getValue()
            });
        //保存
        $.jsonRPC.request(service.UPDATE_USER_INFO, {
            params: {
                params: _this.data
            },
            success: function(response) {
                XyzAlert.success('系统提示：用户信息保存成功！');
                _this.oldData = _this.data;
                FormHelper.stopEdit('#userForm');
                _this._setFormValue();//成功后，重新设置表单
                Observer.trigger('User:refresh', _this.data); //通知父级页面信息更新成功
            },
            error: function(response) {
                XyzAlert.error('系统提示：用户信息保存失败！' + (response.message ? '[' + response.message + ']' : ''));
                window.console && console.log('用户信息保存失败', response);
            }
        });
    }

    //事件绑定
    UserInfo.prototype._initEvents = function() {
        var _this = this;
        $(this.el).find('.btn-edit').click(function() {
            _this._setFormValue();
            FormHelper.startEdit('#userForm');
        });
        $(this.el).find('.btn-cancel').click(function() {
        	_this.data = _this.oldData;//取消，重置表单数据
            _this._setFormValue();
            FormHelper.stopEdit('#userForm');
        });
        $(this.el).find('.btn-save').click(function() {
            _this._save(); 
        });
    }

    //事件绑定
    UserInfo.prototype._setFormValue = function() {
        var _this = this;
        FormHelper.setValue('#userForm', _this.data, true);
        _this.switchON.setValue(_this.data.is_update_pwd == '0' ? false : true);
        _this.passwordExpire.setValue(_this.data.is_always_valid == '0' ? false : true);
        $('#show_is_update_pwd').html(_this.data.is_update_pwd == '0' ? '否' : '是');
        $('#show_is_always_valid').html(_this.data.is_always_valid == '0' ? '否' : '是');
        if ( _this.data.is_always_valid == 1 ) {
       	 $("#div_period_of_validity_id").css("display", "none");
       	 $("#period_of_validity_id").attr("readonly","readonly");
       }else{
       	$("#div_period_of_validity_id").css("display", "");
       	$("#period_of_validity_id").removeAttr("readonly");
       }
    }

    module.exports = UserInfo;
});