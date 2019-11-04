define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        ShineValidator = require('shine-validator'),
        ShineLoaddict = require('shine-loaddict'),  
        FormHelper = require('shine-form');
	
	require('xyz-jsonRPC')($);
    var tpl = require('./template/RoleInfoStep.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        DEP_TREE: SERVICE_GATEWAY + 'epframe.epbos_departmentService.queryAllDepts'
    };


	var RoleInfoStep = function(options) {
		this.initialize(options);
	};

	RoleInfoStep.prototype = {
		initialize : function(options) {
            this.el = options.el;
            this.dep_id = options.dep_id;
            this.data = {};
		},
		render : function() {
            $(this.el).html(tpl);
            this._createForm();
            this._initValidator();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };
    //创建表单元素
    RoleInfoStep.prototype._createForm = function() {
        ShineLoaddict.load("DEP_ID");
        var depId = this.dep_id.toString();
        this.data.dep_name = ShineLoaddict.get('DEP_ID',depId);
        this.data.dep_id = depId;
        FormHelper.setValue('#userRoleForm', this.data, true); //可编辑表单设值
        /* 
        var initData = FormHelper.getValue('#userRoleForm');
        _.assign(this.data, initData);//保存表单初始化数据
        this.dep_id && _.assign(this.data, {dep_id: this.dep_id}); */
    }
    //创建表单元素
    RoleInfoStep.prototype._initValidator = function() {
        this.validator = new ShineValidator({
            el: '#userRoleForm'
        });
    }

    /**
     * 以下方法是步骤条实例必须实现的方式, 保证步骤的正常操作.
     */
    //获取数据
    RoleInfoStep.prototype.getData = function() {
        var role = {};
        role.role = FormHelper.getValue('#userRoleForm');
        role.dep_ids =[this.dep_id.toString()] ;
        return role;
    };
    //检验是否允许切换到下一步
    RoleInfoStep.prototype.checkChange = function (cb) {
        var formData = FormHelper.getValue('#userRoleForm');
        if (!this.validator.form()) {//表单检验不通过
            return {status: 0, message: '表单检验不通过！'};
        }
        return true;
        /* if(!_.isEqual(data, formData)) {   //页面数据发生了变化
            return {status: 1};
        }
        return {status: 0}  */
    };
	
	module.exports = RoleInfoStep;
});