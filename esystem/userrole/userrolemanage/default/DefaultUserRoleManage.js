define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        XyzCover = require('xyz-coverlap'),
        XyzAlert = require('xyz-alert'),
        BaseComm = require('base-common-module'),
        DepSelect = require('/{WEB_NAME}/epframe/release/public/depselect/DepSelect'),
        ESYS = require('/{WEB_NAME}/epframe/release/public/common/ESYS');
    ESYS.require('datatable', 'dialog');
    require('./DefaultUserRoleManage.css');
    var PermissionControl = require('/{WEB_NAME}/epframe/release/public/permissioncontrol/PermissionControl');

    //模板引入
    var mainTpl = require('./template/main.html');


    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=',
        TABLE_GATEWAY = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

    //服务地址
    var service = {
        DELETE_ROLE: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.delUserRoles',
        VALID_USER_ROLE_RELA: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.existUserRoleRela',
        GET_SUIT_DEP: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.existUserRoleRela',
        ROLE_LIST: TABLE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRolesByDepIds',
        SUIT_DEP_IDS: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryDepsByRoleId',
        GET_ALL_DEP: SERVICE_GATEWAY + 'epcum.epbos_departmentService.queryAllDepts'
    };

    var UserRoleManage = function(options) {
        this.initialize(options);
    };
    UserRoleManage.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.userInfo = BaseComm.getUser();
            this.select_dep_id = this.userInfo.dep_id; //解决初始页面时无选中部门值
            this.depTreeSelect;
        },
        render: function() {
            //登录用户是否有访问权限
            var permission = new PermissionControl();
            if(!permission.allow()) {
                return false;    //无权限不允许继续访问
            }
            $(this.el).html(mainTpl);
            this._renderDepTreeSelect();
            this._initEvents();
        },
        dispose: function() {},
        refresh: function() {}
    };

    UserRoleManage.prototype._renderDepTreeSelect = function(){
        var _this = this;
        this.depTreeSelect = new DepSelect({
            el: '#suit_dept_select',
            name: 'suit_dept_select',
            checkAllNodes: true,
            events: {
                dataCallback: function(data){
                    _this._setSrchFormValue(data);
                    _this._renderRoleTable();
                }
            }
        });
        this.depTreeSelect.render();
    };

    UserRoleManage.prototype._setSrchFormValue = function(data){
        this.depTreeSelect.setValue(_.pluck(data, 'dep_id'));
    }
    
    //渲染角色列表
    UserRoleManage.prototype._renderRoleTable = function() {
        var _this = this;
        this.roleTable = new ESYS.datatable({
            el: '#roleTable',
            id: 'roleTable',
            url: service.ROLE_LIST,
            params: {
                params: {
                    'dep_ids': _this.depTreeSelect.getValue().join(','),
                    'role_name': ''
                }
            },
            //checkbox: true,
            columns: [{
                    field: 'role_name',
                    title: '角色名称',
                    tpl: '<a href="javascript:void(0)" d-on-click="this.viewRole(item)">{item.role_name}</a>'
                },
                {
                    field: 'dep_id',
                    title: '适用部门',
                    tpl: '<a href="javascript:void(0)" d-on-click="this.viewSuitDep(item)">查看适用部门</a>'
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
        var _this = this;
        var cov = new XyzCover({
            id: 'role_view_cover',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/UserRoleView'),
                options: {
                    role: data
                }
            }
        });
        cov.render();
    };

    //查看适用部门
    UserRoleManage.prototype.viewSuitDep = function(data){
        var _this = this;
        var winHei = $(window).height();
        var dialog = new ESYS.dialog({
            data: {
                width: 600,
                height: winHei-200,
                title: '适用部门',
                url : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/ViewSuitDepDlg'),
                options : {
                    role: data,
                },
                buttons: [
                    {type: 'save', title: '关闭', handler: function(dlg) {
                         dlg.close();
                    }}
                ]
            }
        });
        dialog.render();
    };

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
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/UserRoleAdd'),
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
        
        $('#query_btn').on('click', function(){
            _this.roleTable.setParams({
                dep_ids: _this.depTreeSelect.getValue().join(','),
                role_name: $('#role_search_input').val()
            })
            _this.roleTable.reload();
        });

        $('#addRoleBtn').click(function() {
            _this.addRole();
        });

        Observer.on('UserRole:refresh', function(data) {
            _this.roleTable.reload();
        }, this);
        
        Observer.on('UserRole:openauthority', function(data) {
            _this._openAuthorityCoverlap(data);
        }, this);

        Observer.on('UserRole:openrelation', function(data) {
            _this._openRelationCoverlap(data);
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
        /* $('#role_search_input').bind('propertychange', searchRoles)
            .bind('input', searchRoles); */
    }

    UserRoleManage.prototype._openAddCoverlap = function(){
        var cover = new XyzCover({
            id: 'roleAdd',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/RoleInfoStep'),
                options: {
                    
                }
            }
        });
        cover.render();
    };
    
    UserRoleManage.prototype._openAuthorityCoverlap = function(data){
        var cover = new XyzCover({
            id: 'roleAuthority',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/RoleRightStep'),
                options: data
            }
        });
        cover.render();
    };

    UserRoleManage.prototype._openRelationCoverlap = function(data){
        var cover = new XyzCover({
            id: 'userBind',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/UserBindStep'),
                options: data
            }
        });
        cover.render();
    };

    module.exports = UserRoleManage;
});