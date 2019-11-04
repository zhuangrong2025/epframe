define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        Observer = require('observer'),
        ShineValidator = require('shine-validator'),
        FormHelper = require('shine-form'),
        XyzAlert = require('xyz-alert'),
        DepSelect = require('/{WEB_NAME}/epframe/release/public/depselect/DepSelect');
	
	require('xyz-jsonRPC')($);
    var tpl = require('./template/RoleInfoStep.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        DEP_TREE: SERVICE_GATEWAY + 'epcum.epbos_departmentService.queryAllDepts',
        SAVE_USER_ROLE: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRoleUnited'
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
            this._bindEvent();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };
    //创建表单元素
    RoleInfoStep.prototype._createForm = function() {
        var _this = this;

        this.depTreeSelect = new DepSelect({
            el: '#ROLE_DEP_ID',
            name: 'dep_id',
            required: true
        });
        this.depTreeSelect.render();

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
    };

    RoleInfoStep.prototype._bindEvent = function(){
        var _this = this;
        //取消
        $("#roleAddCancel").click(function() {
            _this._exit();
        });

        //保存
        $("#roleAddSave").click(function() {
            if (_this.validator.form()) {
                _this._saveRoleInfo();
            }
        });

        //为角色授权
        $('#openAuthority').on('click', function(){
            var optData = {
                userRoleId: _this.userRoleId,
                suitDeptIds: _this.depTreeSelect.getValue(),
                suitDeptItems: _this.depTreeSelect.getValueData()
            };
            _this._exit();
            Observer.trigger('UserRole:openauthority', optData); //通知父级页面信息更新成功,打开开启权限弹层
        });
    };

    //返回查询页面
    RoleInfoStep.prototype._exit = function() {
        var cov = window.XyzCoverlap && window.XyzCoverlap.roleAdd;
        cov && cov.dispose();
    };

    //保存部门信息
    RoleInfoStep.prototype._saveRoleInfo = function() {
        var _this = this,
            data = FormHelper.getValue('#userRoleForm');
        if(this.processing === true) {//防止重复提交
            return;
        }
        this.processing = true; //处理中
        var roleParams = {
            role: {
                role_name: data.role_name,
                note: data.note
            },
            dep_ids: data.dep_id
        }
        //保存
        $.jsonRPC.request(service.SAVE_USER_ROLE, {
            params: {
                params: roleParams
            },
            success: function(response) {
                $('#operationSuccessLayer').show();
                Observer.trigger('UserRole:refresh', data);//通知父级页面新增部门成功
                _this.userRoleId = response.data;
                _this.processing = false;
            },
            error: function(response) {
                _this.processing = false;
                XyzAlert.error('系统提示：' + (response.message ? response.message : (response.desc ? +response.desc : '新增部门失败！')));
                window.console && console.log('新增部门失败', response);
            }
        });
    };

    /**
     * 以下方法是步骤条实例必须实现的方式, 保证步骤的正常操作.
     */
    //获取数据
    RoleInfoStep.prototype.getData = function() {
        var role = FormHelper.getValue('#userRoleForm');
        var data = {};
        data.role = role;       
        data.dep_ids = this.depTreeSelect.getValue();
        data.suitDeptsData = this.depTreeSelect._getSelections();
        delete data.role.dep_id;
        return data;
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