define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        XyzSelect = require('xyz-select2'),
        mainTpl = require('./template/UserInfoStep.html'),
        XyzBootstrapSwitch = require('xyz-bootstrap-switch'),
        XyzTreeselect = require('xyz-treeselect'),
        ShineValidator = require('shine-validator'),
        XyzAlert = require('xyz-alert'),
        FormHelper = require('shine-form');
        require('xyz-iconfont');

    var DATATABLES_GATEWAY = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';
    var service = {
        ADD_USER_INFO: SERVICE_GATEWAY +
            'epcum.epbos_userManageService.addUser',
        GET_DEPART_TREE: SERVICE_GATEWAY +
            'epcum.epbos_departmentService.queryAllDepts'
    };

    var UserInfoStep = function(options) { //不用去动，spm自动生成。
        this.initialize(options);
    };

    UserInfoStep.prototype = { //模块原生方法 
        //初始化方法 
        initialize: function(options) { 
        	//全局变量,支持自定义email长度
            var emialLen = options.emialLen || 80;  
            this.el = $(options.el); //el为外部给的dom选择器，例如："#main", ".main"等
            this.dep_id = options.dep_id;
        },
        //渲染方法，当外部需要加载模块时调用
        render: function() {
            this.el.html(mainTpl);
            this._renderElement();
            this._createDepTree();
            this._initValidator();
            this._bindEvent();
        },
        //销毁模块方法，一般是删除模块的所有dom内容，以及删除所有相关的observer事件
        dispose: function() {},
        //模块刷新方法
        refresh: function() {}
    };

    //获取上级部门信息
    UserInfoStep.prototype._createDepTree = function() {
        var _this = this;
        //只显示操作用户所在的部门及其子部门
        _this.depTree = new XyzTreeselect({
            el: '#DEP_ID',
            name: 'dep_id',
            required: true,
            multiple: false,
            placeholder: "请选择",
            ajax: {
                id: 'dep_id',
                pid: 'parent_dep_id',
                text: 'dep_name',
                url: service.GET_DEPART_TREE,
                params: {
                    params: { status: '0' }
                }
            },
            events: {
                dataCallback: function(_m) {
                    if(_this.dep_id) {
                        _this.depTree.setValue(_this.dep_id);
                    }
                }
            }
        });
        this.depTree.render();
    };

    UserInfoStep.prototype._renderElement = function() {
        var _this = this;

        this.switchON = new XyzBootstrapSwitch({
            el: "#IS_UPDATE_PWD",
            onText: '是', //状态为打开时文本
            offText: '否', //状态为关闭时文本
            state: true, //默认状态，true为开，false为关.   默认为true
            events: {
                change: function(val, m, state) { //val为开关状态，m为实例， state为是否为人为点击
                    // _this.isUpdatePwd = (val==true ? 1:0);
                }
            }
        })
        this.switchON.render();
        //创建密码永不过期开关

        this.passwordExpire = new XyzBootstrapSwitch({
            el: "#IS_ALWAYS_VALID",
            onText: '是', //状态为打开时文本
            offText: '否', //状态为关闭时文本
            state: true, //默认状态，true为开，false为关.   默认为true
            events: {
                change: function(val, m, state) { //val为开关状态，m为实例， state为是否为人为点击
                       if (val){
                    	   $("#period_of_validity_id").attr("readonly","readonly");
                       }else{
                    	   $("#period_of_validity_id").removeAttr("readonly");
                       }
                }
            }
        }); 
        this.passwordExpire.render();
       // this.passwordExpire默认为true,输入框默认只读状态
        $("#period_of_validity_id").attr("readonly","readonly");
        //创建用户组下拉框
        this.userGroupSelect = new XyzSelect({
            el: '#USER_GROUP',
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
        this.userGroupSelect.setValue('3');
    };

    //创建表单验证器
    UserInfoStep.prototype._initValidator = function() { 
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
        $.validator && $.validator.addMethod("userCode", function(value, element) {
            var userCode = /^[0-9A-Za-z]{1,30}$/;
            return this.optional(element) || userCode.test(value);
        }, "登录名为30位以内的数字与字母组成");
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
                },
                user_code :{
                    userCode :true
                }
            }
        });
    }
    UserInfoStep.prototype._bindEvent = function(){
        var _this = this;
        $('#userAddSave').on('click', function(){
            if(_this.userFormValidator.form()){
                var data = _this.getData();
                _this.userCode = data.user_code;
                _this.userGroup = data.user_group;
                $.jsonRPC.request(service.ADD_USER_INFO, {
                    params: {
                        params: data
                    },
                    success: function(response) {
                        $('#useraddSuccessLayer').show();
                        Observer.trigger('User:refresh'); //通知父级页面信息更新成功
                    },
                    error: function(response) {
                        XyzAlert.error('系统提示：数据保存失败！' + (response.message ? '[' + response.message + ']' : ''));
                    }
                });
            }
        });

        $('#userAddCancel, #returnBtn').on('click', function(){
            _this._exit();
        });

        $('#relativeRole').on('click', function(){
            _this._exit();
            var userInfo = {
                userCode: _this.userCode,
                userGroup: _this.userGroup
            }
            Observer.trigger('User:showrole', userInfo); //通知父级页面信息更新成功
        });


    };

    UserInfoStep.prototype._exit = function(){
        var cov = window.XyzCoverlap && window.XyzCoverlap.user_add_cover;
        cov && cov.dispose();
    };
    /**
     * 以下方法是步骤条实例必须实现的方式, 保证步骤的正常操作
     */
    //获取数据
    UserInfoStep.prototype.getData = function() {
        var _this = this;
        var data = FormHelper.getValue('#userForm');
        _.assign(data, {
            is_update_pwd: _this.switchON.getValue() == false ? '0' : '1',
            is_always_valide: _this.passwordExpire.getValue() == false ? '0' : '1'
        });
        return data;
    };
    //检验是否允许切换到下一步
    UserInfoStep.prototype.checkChange = function(cb) {
        var formData = FormHelper.getValue('#userForm');
        if (!this.userFormValidator.form()) { //表单检验不通过
            return { status: 0, message: '表单检验不通过！' };
        }
        return true;
    };
    module.exports = UserInfoStep;
});