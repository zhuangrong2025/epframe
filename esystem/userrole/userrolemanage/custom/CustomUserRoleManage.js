define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        XyzCover = require('xyz-coverlap'),
        XyzAlert = require('xyz-alert'),
        BaseComm = require('base-common-module'),
        ESYS = require('/{WEB_NAME}/epframe/release/public/common/ESYS');
        ESYS.require('deptreepanel');

    ESYS.require('datatable');
    var PermissionControl = require('/{WEB_NAME}/epframe/release/public/permissioncontrol/PermissionControl');

    //模板引入
    var mainTpl = require('./template/main.html');


    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=',
        TABLE_GATEWAY = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

    //服务地址
    var service = {
        ROLE_LIST: TABLE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoles',
        DELETE_ROLE: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.delUserRoles',
        USER_ROLE_CONTROL: SERVICE_GATEWAY + 'epframe.epbos_systemParamService.getParamByParamCode',
        VALID_USER_ROLE_RELA: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.existUserRoleRela'
    };

    var UserRoleManage = function(options) {
        this.initialize(options);
    };
    UserRoleManage.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.userInfo = BaseComm.getUser();
            this.select_dep_id = this.userInfo.dep_id; //解决初始页面时无选中部门值
        },
        render: function() {
            //登录用户是否有访问权限
            var permission = new PermissionControl();
            if(!permission.allow()){
                return false;    //无权限不允许继续访问
            }
            $(this.el).html(mainTpl);
            this._renderRoleTable();
            this._renderDepTree();
            this._initEvents();
        },
        dispose: function() {},
        refresh: function() {}
    };

    //渲染侧部门树面板
    UserRoleManage.prototype._renderDepTree = function() {
        var _this = this;
        this.deptreePanel = new ESYS.deptreepanel({
            el: '#depTreePanel',
            events: {
                dataCallback: function(tree) {
                    tree.setValue(_this.userInfo.dep_id);
                },
                click: function(data) {
                    _this.select_dep_id = data.dep_id;
                    _this.select_dep = data;
                    _this.roleTable.setParams({ dep_id: data.dep_id });
                    _this.roleTable.reload();
                }
            }
        })
        this.deptreePanel.render();
    };
    //渲染角色列表
    UserRoleManage.prototype._renderRoleTable = function() {
        var _this = this;
        this.roleTable = new ESYS.datatable({
            el: '#roleTable',
            id: 'roleTable',
            url: service.ROLE_LIST,
            params: {
                params: { dep_id: _this.userInfo.dep_id },
            },
            //checkbox: true,
            columns: [{
                    field: 'role_name',
                    title: '角色名称',
                    tpl: '<a href="javascript:void(0)" d-on-click="this.viewRole(item)">{item.role_name}</a>'
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
        this.roleTable.render();
    };

    //查看角色
    UserRoleManage.prototype.viewRole = function(data) {
        //将创建部门id转为适用部门id
        data.dep_id = this.select_dep_id;
            var _this = this;
            var cov = new XyzCover({
                id: 'role_view_cover',
                child: {
                    path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/custom/UserRoleView'),
                    options: {
                        role: data
                    }
                }
            });
            cov.render();
        }
        //删除角色
    UserRoleManage.prototype.deleteRole = function(role) {
        var _this = this;

        function doDelete() { //执行删除操作

            //验证用户角色是否被赋予用户
            $.jsonRPC.request(service.VALID_USER_ROLE_RELA, {
                params: {
                    params: {
                        role_id: role.role_id
                    }
                },
                success: function(response) {
                    var flag = response.data;
                    if (flag) {
                        XyzAlert.info("用户角色已被赋予用户，无法删除");
                    } else {
                        execDelete();
                    }
                }
            });
        }
        //执行删除
        function execDelete() {
            //删除用户角色
            $.jsonRPC.request(service.DELETE_ROLE, {
                params: {
                    params: {
                        role_ids: [role.role_id]
                    }
                },
                success: function(response) {
                    var data = response.data;
                    _this.roleTable.reload(); //刷新表格数据
                }
            });
        }

        XyzAlert.info("确认删除该角色?", {
            showCancelButton: true,
            closeOnConfirm: true,
            closeOnCancel: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            confirm: doDelete
        });
    }

    //打开coverlap， 进入新增角色步骤页面
    UserRoleManage.prototype.addRole = function(depId) {
        var _this = this;
        var cov = new XyzCover({
            id: 'role_add_cover',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/custom/UserRoleAdd'),
                options: {
                    dep_id: depId,
                    userRoleControl: _this.userRoleControl
                }
            }
        });
        cov.render();
    };

    //绑定事件
    UserRoleManage.prototype._initEvents = function() {
        var _this = this;
        $('#addRoleBtn').click(function() {
            var depId = _this.deptreePanel.getTree().getValue() || '';
            _this.addRole(depId);
        });
        Observer.on('UserRole:refresh', function(data) {
            _this.roleTable.reload();
        }, this);
        //搜索框输入自动查询角色列表
        var timeoutId = null;

        function searchRoles() { //查找筛选角色
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            var text = $(this).val();
            timeoutId = setTimeout(function() {
                _this.roleTable.setParams({
                    dep_id: _this.select_dep_id || -1,
                    role_name: text
                });
                _this.roleTable.reload();
            }, 500);
        }
        $('#role_search_input').bind('propertychange', searchRoles)
            .bind('input', searchRoles);
    }

    module.exports = UserRoleManage;
});