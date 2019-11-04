define(function(require, exports, module) {
    var _ = require('lodash'),
        $ = require('jquery'),
        Observer = require('observer'),
        ShineValidator = require('shine-validator'),
        ShineLoaddict = require('shine-loaddict'),
        FormHelper = require('shine-form'),
        XyzAlert = require('xyz-alert');


    require('xyz-jsonRPC')($);
    var tpl = require('./template/RoleInfoTab.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        DEP_TREE: SERVICE_GATEWAY + 'epframe.epbos_departmentService.queryAllDepts',
        SAVE_ROLE: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRole'
    };

    var RoleInfoTab = function(options) {
        this.initialize(options);
    };

    RoleInfoTab.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.role = options.role;
            this.data = _.assign({}, options.role);
        },
        render: function() {
            $(this.el).html(tpl);
            this._createForm();
            this._initValidator();
            this._initEvents();
        },
        dispose: function() {},
        refresh: function() {}
    };

    //创建表单元素
    RoleInfoTab.prototype._createForm = function() {
        var depId = this.role.dep_id.toString();
        this.data.dep_name = ShineLoaddict.get('DEP_ID',depId);
        FormHelper.setValue('#userRoleForm', this.data, true); //可编辑表单设值
    };

    //创建表单元素
    RoleInfoTab.prototype._initValidator = function() {
        this.validator = new ShineValidator({
            el: '#userRoleForm'
        });
    };

    //角色更新
    RoleInfoTab.prototype._save = function() {
        if (!this.validator.form()) { //表单检验不通过
            return false;
        }
        var data = FormHelper.getValue('#userRoleForm'),
            _this = this;
        _.assign(data, {
            role_id: this.role.role_id,
            dep_id: this.role.dep_id
        });
        //保存
        $.jsonRPC.request(service.SAVE_ROLE, {
            params: {
                params: { role: data }
            },
            success: function(response) {
                XyzAlert.success('系统提示：角色信息保存成功！');
                _this.data = data;
                FormHelper.stopEdit('#userRoleForm');
                FormHelper.setValue('#userRoleForm', data, true);
                Observer.trigger('UserRole:refresh', data); //通知父级页面信息更新成功
            },
            error: function(response) {
                XyzAlert.error('系统提示：角色信息保存失败！' + (response.message ? '[' + response.message + ']' : ''));
                window.console && console.log('角色信息保存失败', response);
            }
        });
    };

    //事件绑定
    RoleInfoTab.prototype._initEvents = function() {
        var _this = this;
        $('#edit_btn').click(function() {
            FormHelper.startEdit('#userRoleForm');
        });
        $('#cancel_btn').click(function() {
            FormHelper.setValue('#userRoleForm', _this.role, true);
            FormHelper.stopEdit('#userRoleForm');
        });
        $('#save_btn').click(function() {
            _this._save();
        });
    };

    module.exports = RoleInfoTab;
});