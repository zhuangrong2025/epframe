define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        ShineValidator = require('shine-validator'),
        FormHelper = require('shine-form'),
        Observer = require('observer');
	
	
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
            this.validator
		},
		render : function() {
            $(this.el).html(tpl);
            this._initValidator();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };
    //创建表单元素校验器
    RoleInfoStep.prototype._initValidator = function() {
        this.validator = new ShineValidator({
            el: '#depRoleForm'
        });
    }

    /**
     * 以下方法是步骤条实例必须实现的方式, 保证步骤的正常操作.
     */
    //获取数据
    RoleInfoStep.prototype.getData = function() {
        return FormHelper.getValue('#depRoleForm');
    };
    //检验是否允许切换到下一步
    RoleInfoStep.prototype.checkChange = function (cb) {
        //return {status : 1};
        var formData = FormHelper.getValue('#depRoleForm');
        if (!this.validator.form()) {//表单检验不通过
            return {status: 0, message: '表单检验不通过！'};
        }

        Observer.trigger('DepRole:refresh', formData);
        return {status : 1};
        /* if(!_.isEqual(data, formData)) {   //页面数据发生了变化
            return {status: 1};
        }
        return {status: 0}  */
    };
	
	module.exports = RoleInfoStep;
});