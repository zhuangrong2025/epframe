define(function(require, exports, module) {
    var _ = require('lodash'),
        $ = require('jquery'),
        Observer = require('observer'),
        ShineValidator = require('shine-validator'),
        ShineLoaddict = require('shine-loaddict'),
        FormHelper = require('shine-form'),
        XyzAlert = require('xyz-alert'),
        DepSelect = require('/{WEB_NAME}/epframe/release/public/depselect/DepSelect');


    require('xyz-jsonRPC')($);
    var tpl = require('./template/RoleInfoTab.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        SUIT_DEP_IDS: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryDepsByRoleId',
        DEP_TREE: SERVICE_GATEWAY + 'epcum.epbos_departmentService.queryAllDepts',
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
        var _this = this;
        var depId = this.role.dep_id.toString();
        //this.data.dep_name = ShineLoaddict.get('DEP_ID',depId);
        this.data.dep_name = this.role.dep_id_dict;

        $.jsonRPC.request(service.SUIT_DEP_IDS, {
            params: {
                params: {
                    role_id: _this.role.role_id
                }
            },
            success: function(response) {
                _this.role.suit_dep_ids = response.data;
                _this._renderDepTreeSelect();
            }
        });
    };

    RoleInfoTab.prototype._renderDepTreeSelect = function(){
        var _this = this;
        this.depTreeSelect = new DepSelect({
            el: '#depTreeSelect',
            name: 'dep_id',
            required: true,
            events: {
                dataCallback: function(m) {
                    _this._setFormValue();
                }
            }
        });
        this.depTreeSelect.render();
    }

    RoleInfoTab.prototype._setFormValue = function() {
        FormHelper.setValue('#userRoleForm', this.data, true); //可编辑表单设值
        this.depTreeSelect.setValue(this.role.suit_dep_ids);
        $('#userRoleForm #dep_name').html(this.depTreeSelect.getText());
    };

    //创建表单元素
    RoleInfoTab.prototype._initValidator = function() {
        this.validator = new ShineValidator({
            el: '#userRoleForm'
        });
    };

    //角色更新
    RoleInfoTab.prototype._save = function() {
        var _this = this;
        if (!this.validator.form()) { //表单检验不通过
            return false;
        }
        var data = FormHelper.getValue('#userRoleForm');
        data.dep_ids = this.depTreeSelect.getValue();
        this.role.suit_dep_ids = data.dep_ids;
        var params = {
            role: {
                role_id: this.role.role_id,
                role_name: data.role_name,
                note: data.note,
                dep_id: _this.role.dep_id
            },
            dep_ids: data.dep_ids
        }
        //保存
        $.jsonRPC.request(service.SAVE_ROLE, {
            params: {
                params: params
            },
            success: function(response) {
                XyzAlert.success('系统提示：角色信息保存成功！');
                _this.data = data;
                FormHelper.stopEdit('#userRoleForm');
                _this._setFormValue();
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
            _this.depTreeSelect.setValue(_this.role.suit_dep_ids);
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