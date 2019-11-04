define(function(require, exports, module) {
    var _ = require('lodash'),
        $ = require('jquery'),
        Observer = require('observer'),
        FormHelper = require('shine-form'),
        XyzAlert = require('xyz-alert'),
        ShineValidator = require('shine-validator');

    require('xyz-jsonRPC')($);
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        UPDATE_ROLE_INFO: SERVICE_GATEWAY + 'epframe.epbos_deptRoleService.updateDepRole'
    };
    var tpl = require('./template/RoleInfoTab.html');
    var RoleInfo = function(options) {
        this.initialize(options);
    };

    RoleInfo.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            this.role = options.role;
        },
        render: function() {
            this.el.html(tpl);
            this._createForm();
            this._bindEvent();
        },
        dispose: function() {
            this.formValidator.destroy();
            this.el.empty();
        },
        refresh: function() {
            this.dispose();
            this.render()
        }
    };

    //创建表单验证器
    RoleInfo.prototype._createForm = function() {
        this.formValidator = new ShineValidator({
            el: '#roleInfoForm'
        });
        this.role && FormHelper.setValue('#roleInfoForm', this.role, true);
    };
    //保存角色信息操作
    RoleInfo.prototype._saveRoleInfo = function() {
        var _this = this,
            serviceUrl,
            serviceArg = FormHelper.getValue('#roleInfoForm');
        var oldDepRoleName = $('[field="role_name"]').text();
        serviceArg.role_id = this.role.role_id;
        serviceArg.old_role_name = oldDepRoleName;
        serviceUrl = service.UPDATE_ROLE_INFO;
        //保存
        $.jsonRPC.request(serviceUrl, {
            params: {
                params: serviceArg
            },
            success: function(response) {
                XyzAlert.success('系统提示：修改部门角色成功！');
                _this.role = serviceArg;
                //页面显示更新
                FormHelper.stopEdit('#roleInfoForm');
                FormHelper.setValue('#roleInfoForm', serviceArg, true);
                Observer.trigger('DepRole:updateItem', serviceArg); //通知父级页面信息修改部门角色成功
            },
            error: function(response) {
                XyzAlert.error('系统提示：角色信息保存失败！' + (response.desc ? '[' + response.desc + ']' : ''));
                window.console && console.log('角色信息保存失败', response);
            }
        });

    };
    //绑定事件
    RoleInfo.prototype._bindEvent = function() {
        var _this = this;
        /*部门角色列表为空时，无权限且不允许修改 */
        if(!_this.role){
            $(".btn-edit").attr("disabled",true);
        }
        Observer.on('deprole:click', function(data, change) {
            if (change) {
                _this.role = data;
                FormHelper.stopEdit('#roleInfoForm');
                //清空角色说明，排除角色说明为空的情况
                $("[field='note']").html("");
                FormHelper.setValue('#roleInfoForm', data, true);
                $(".btn-edit").attr("disabled",false);
            }
        });
        //部门角色用户全部删除时触发
        Observer.on('DepInfodelete', function(data) {
            $("[field='note']").html("");
            $("[field='role_name']").html("");
            $(".btn-edit").attr("disabled",true);
        });
        //保存角色权限信息
        this.el.find('.btn-save').unbind('click').bind('click', function() {
            if (_this.formValidator.form()) {
                //目前接口调试还没实现，先使用add接口
                _this._saveRoleInfo();
            }

        });
        //修改角色信息
        this.el.find('.btn-edit').unbind('click').bind('click', function() {
            if (!_this.role) {
                XyzAlert.info('请先选择角色！');
                return;
            }
            FormHelper.startEdit('#roleInfoForm');
        });
        //点击取消操作
        this.el.find('.btn-cancel').unbind('click').bind('click', function(e) {
            FormHelper.stopEdit('#roleInfoForm');
            FormHelper.setValue('#roleInfoForm', _this.role, true);
        });
    };

    module.exports = RoleInfo;
});