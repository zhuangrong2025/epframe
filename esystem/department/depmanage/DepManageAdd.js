define(function(require, exports, module) {
    var $ = require('jquery'),
        baseCommon = require('base-common-module'),
        shineForm = require('shine-form'),
        xyzAlert = require('xyz-alert'),
        Observer = require('observer'),
        ShineValidator = require('shine-validator'),
        XyzTreeselect = require('xyz-treeselect');

    var mainTpl = require('./template/DepManageAdd.html');

    //全局常量
    var DEFAULT_DEP_CODE_LEN = 10; //默认部门代码长度

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        GET_PARENT_DEP: SERVICE_GATEWAY + 'epcum.epbos_departmentService.getParentDep',
        ADD_DEP_INFO: SERVICE_GATEWAY + 'epcum.epbos_departmentService.addDepInfo',
        VALIDATE_DEP_CODE: SERVICE_GATEWAY + 'epcum.epbos_departmentService.validateDepCode',
        VALIDATE_DEP_NAME: SERVICE_GATEWAY + 'epcum.epbos_departmentService.validateDepName'
    };

    var DepManageAdd = function(options) {
        this.initialize(options);
    };

    DepManageAdd.prototype = {
        initialize: function(options) {
            this.parent = options.depManageThis;
            this.el = $(options.el);
            //全局变量
            var depCodeLen = options.depCodeLen || {};
            this.depCodeMinLen = depCodeLen.min || 10;
            this.depCodeMaxLen = depCodeLen.max || 10;
            this.parentDepId = options.parentDepId; //部门树中选中的部门ID
            this.parentDepTree;
            this.formValidator;
        },
        render: function() {
            $(this.el).html(mainTpl);
            this.form = $('#addDepForm');
            this._createParentDepTree();
            this._createFormValidate();
            this._bindEvent();
        },
        dispose: function() {
            $(this.el).empty().remove();
        }
    }

    //获取上级部门信息
    DepManageAdd.prototype._createParentDepTree = function() {
        if (null != this.parentDepTree) {
            this.parentDepTree.dispose();
        }
        var _this = this;
        this.parentDepTree = new XyzTreeselect({
            el: '#add_parent_dep_id',
            name: 'parent_dep_id',
            required: true,
            multiple: false,
            ajax: {
                id: 'dep_id',
                pid: 'parent_dep_id',
                text: 'dep_name',
                url: service.GET_PARENT_DEP,
                params: {
                    params: {}
                }
            },
            opt: {
                root: ''
            },
            events: {
                dataCallback: function(treeselect) {
                    if(_this.parentDepId) {
                        treeselect.setValue(_this.parentDepId);
                    }
                }
            }
        });
        this.parentDepTree.render();
    };


    //创建表单验证器
    DepManageAdd.prototype._createFormValidate = function() {
        $('#add_depCode').attr({
            'minlength': this.depCodeMinLen,
            'maxlength': this.depCodeMaxLen
        });
        //修改联系电话格式--临时解决方案
        $.validator && $.validator.addMethod("isTel", function(value, element) {
            var mobile = /^1[3456789]\d{9}$/;
            var tel = /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,8}$/;
            //var tel = /^(((\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,8})|(1[3456789]\d{9}))$/;
            return this.optional(element) || tel.test(value) || mobile.test(value);
        }, "请正确填写您的电话号码");
        this.formValidator = new ShineValidator({
            el: '#addDepForm',
            rules: {
                dep_code: {
                    custom: {
                        context: this,
                        dependency: function(nextHandler, value, element) {
                            this._validateDepCode(value, function(data) {  
                                nextHandler(data);
                            });
                        }
                    }
                },
                dep_name: {
                    custom: {
                        context: this,
                        dependency: function(nextHandler, value, element) {
                            this._validateDepName(value, function(data) {
                                nextHandler(data);
                            });
                        }
                    }
                },
                post: {
                    isZipCode: true
                },
                tel: {
                	isTel: true
                },
                email: {
                    email: true
                }
            }
        });
    };

    //验证部门代码是否已经存在
    DepManageAdd.prototype._validateDepCode = function(depCode, callback) { 
    	//1.判断部门代码必须10位
        //2.判断部门代码是否存在
        var userCode = /^[0-9A-Za-z]{1,10}$/;
        if(!userCode.test(depCode)){
            callback('部门编码为10位的数字或字母组成');
            return;
        }
        $.jsonRPC.request(service.VALIDATE_DEP_CODE, {
            params: {
                params: {
                    dep_code: depCode
                }
            },
            success: function(response) {
                callback(response.data > 0 ? '部门代码已存在' : true);
            },
            error: function() {
                callback('部门代码验证出错，请重试');
            }
        });
    };

    //验证部门名称是否已经存在
    DepManageAdd.prototype._validateDepName = function(depName, callback) {
        $.jsonRPC.request(service.VALIDATE_DEP_NAME, {
            params: {
                params: {
                    dep_name: depName
                }
            },
            success: function(response) {
                callback(response.data > 0 ? '部门名称已存在' : true);
            },
            error: function() {
                callback('部门名称验证出错，请重试');
            }
        });
    };

    //返回查询页面
    DepManageAdd.prototype._exit = function() {
        var cov = window.XyzCoverlap && window.XyzCoverlap.departAdd;
        cov && cov.dispose();
    };

    //保存部门信息
    DepManageAdd.prototype._saveDepInfo = function() {
        var _this = this,
            data = shineForm.getValue(_this.form);
        if(this.processing === true) {//防止重复提交
            return;
        }
        this.processing = true; //处理中
        //保存
        $.jsonRPC.request(service.ADD_DEP_INFO, {
            params: {
                params: data
            },
            success: function(response) {
                Observer.trigger('DepInfo:add', data);//通知父级页面新增部门成功
                _this._exit();
                _this.processing = false;
                xyzAlert.success('系统提示：新增部门成功！');
            },
            error: function(response) {
                _this.processing = false;
                xyzAlert.error('系统提示：' + (response.message ? response.message : (response.desc ? +response.desc : '新增部门失败！')));
                window.console && console.log('新增部门失败', response);
            }
        });
    };

    //按钮触发事件
    DepManageAdd.prototype._bindEvent = function() {
        var _this = this;

        //取消
        $("#departAddCancel").click(function() {
            _this._exit();
        });

        //保存
        $("#departAddSave").click(function() {
            if (_this.formValidator.form()) {
                _this._saveDepInfo();
            }
        })
    };

    module.exports = DepManageAdd;
});