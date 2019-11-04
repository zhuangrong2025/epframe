define(function(require, exports, module) {
    var $ = require('jquery'),
        mainTpl = require('./template/RoleRight.html'),
        XyzAlert = require('xyz-alert'),
        ESYS = require('../../../../public/common/ESYS');

    ESYS.require('datatable','userrightview','dialog');

    var DATATABLES_GATEWAY = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';
    var service = {
        GET_USER_ROLE: DATATABLES_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoleRelasByUser',
        DEL_USER_ROLE: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.delUserRoleRela',
        GET_USER_ROLE_NUM: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.getUserRoleNum'
    };

    var RoleRight = function(options) { //不用去动，spm自动生成。
        this.initialize(options);
    };

    RoleRight.prototype = { //模块原生方法
        //初始化方法，用于缓存外部传递的参数
        initialize: function(options) {
            this.el = $(options.el); //el为外部给的dom选择器，例如："#main", ".main"等
            this.user_code = options.user_code;
            this.user_status = options.user_status;
            this.dep_id = options.dep_id;
            this.user_group = options.user_group;
            this.userRoleControl = options.userRoleControl;
            _this.app_id = options.app_id;
            this.userRightTable;
        },
        //渲染方法，当外部需要加载模块时调用
        render: function() {
            this.el.html(mainTpl);
            //用户状态为注销、冻结、挂起的 不能编辑
            if(this.user_status!=='0'){
                $(this.el).find('#btn-rela').attr('disabled', true);
            }
            this._renderUserRightTable();
            this._checkUserRoleControl();
            this._relaBindEvent();
        },
        //销毁模块方法，一般是删除模块的所有dom内容，以及删除所有相关的observer事件
        dispose: function() {},
        //模块刷新方法
        refresh: function() {}
    };

    //渲染角色列表
    RoleRight.prototype._renderUserRightTable = function() {
        var _this = this;
        if (this.userRightTable) {
            this.userRightTable.dispose();
        }
        this.userRightTable = new ESYS.datatable({
            el: '#userRightTable',
            id: 'userRightTable',
            url: service.GET_USER_ROLE,
            params: {
                params: { user_code: _this.user_code },
            },
            //checkbox: true,
            columns: [{
                    field: 'role_name',
                    title: '角色名称'
                },
                {
                    field: 'note',
                    title: '备注'
                },
                {
                    field: 'operate',
                    title: '操作',
                    locked: true,
                    width: 100,
                    tpl: '<button type="button" class="btn btn-delete" d-on-click="this.deleteRole(item)"><i class="fa fa-close"></i> 删除</button>'
                }
            ]
        }, this);
        _this.userRightTable.render();
    };

    //绑定事件
    RoleRight.prototype.deleteRole = function(data) {
        var _this = this;
        if (null !== data.role_id && '' !== data.role_id) {
            XyzAlert.info("确认删除该角色?", {
                showCancelButton: true,
                closeOnConfirm: true,
                closeOnCancel: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                confirm: function() {
                    $.jsonRPC.request({
                        url: service.DEL_USER_ROLE,
                        params: {
                            params: {
                                role_id: data.role_id,
                                user_code: _this.user_code
                            }
                        },
                        success: function(response, url) {
                            _this.userRightTable.setParams({ user_code: _this.user_code });
                            _this.userRightTable.reload();
                        }
                    });
                }
            });

        }
    };
    RoleRight.prototype._relaBindEvent = function() {
        var _this = this;

        $('#view_permsion').on('click', function() {
            new ESYS.userrightview({
                user_code: _this.user_code
            }).render();
        });

        $('#btn-rela').on('click', function() {
            var dialog = new ESYS.dialog({
                data: {
                    width: 900,
                    title: '关联角色',
                    url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/child/RoleRela'),
                    options: {
                        user_code: _this.user_code,
                        dep_id: _this.dep_id,
                        user_group: _this.user_group,
                        app_id: _this.app_id,
                        userRoleControl: _this.userRoleControl
                    },
                    buttons: [
                        { type: 'cancel' },
                        {
                            type: 'save',
                            handler: function(dlg) {
                                var inst = this.getInstance();
                                var selectedLength = inst.transfer.rightBox.data.length;
                                if(_this.userRoleControl > 0 && selectedLength > _this.userRoleControl){
                                    dlg.close();
                                    XyzAlert.warning('当前用户最多只能指定[' + _this.userRoleControl + ']个用户角色，\n请修改当前用户[' + _this.user_code + ']的关联角色！');
                                    return;
                                }
                                var cb = function() {
                                    _this.userRightTable.setParams({ user_code: _this.user_code });
                                    _this.userRightTable.reload();
                                    dlg.close();
                                }
                                inst.save && inst.save(cb); //保存
                            }
                        }
                    ]
                }
            });
            dialog.render();
        });
    };
    //用户角色策略检查
    RoleRight.prototype._checkUserRoleControl = function() {
        var _this = this;
        if (this.userRoleControl > 0) {
            $.jsonRPC.request(service.GET_USER_ROLE_NUM, {
                params: {
                    params: {
                        dep_id: _this.dep_id,
                        user_code: _this.user_code
                    }
                },
                success: function(response) {
                    var data = response.data;
                    if ($.isArray(data) && data.length > 0) {
                        if (data[0].role_count > _this.userRoleControl) {
                            XyzAlert.warning('当前用户最多只能指定[' + _this.userRoleControl + ']个用户角色，\n请修改当前用户[' + _this.user_code + ']的关联角色！');
                        }
                    }
                }
            });
        }
    };
    module.exports = RoleRight;
});