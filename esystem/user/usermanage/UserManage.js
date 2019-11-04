define(function(require, exports, module) {
    var $ = require('jquery'),
        Observer = require('observer'),
        XyzCover = require('xyz-coverlap'),
        XyzAlert = require('xyz-alert'),
        BaseComm = require('base-common-module'),
        ESYS = require('../../../public/common/ESYS');
    ESYS.require('datatable','deptreepanel','dialog');
    require('./UserManage.css');
    require('bootstrap-maxlength')($); // 输入框的最大长度 待删
    require('../../../public/lib/i18next');
    var mainTpl = require('./template/UserManageMain.html');
    var service = function() {
        var JSON_BASE = '/EPSERVICERUN/json/USAccess/json.do?service=',
            TABLE_BASE = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

        function getJsonURL(servUrl) {
            return JSON_BASE + servUrl;
        }

        function getTableURL(servUrl) {
            return TABLE_BASE + servUrl;
        }
        return {
            USER_ROLE_CONTROL: getJsonURL('epframe.epbos_systemParamService.getParamByParamCode'),
            GET_USERS: getTableURL('epcum.epbos_userManageService.queryAllUserList'),
            GET_DEP_TREE: getJsonURL('epcum.epbos_departmentService.queryAllDepts'),
            UPD_USER_STATUS: getJsonURL('epcum.epbos_userManageService.updateUserStatus')
        }
    }();

    var UserManage = function(options) { // 不用去动，spm自动生成。
        this.initialize(options);
    };

    UserManage.prototype = { // 模块原生方法
        // 初始化方法，用于缓存外部传递的参数
        initialize: function(options) {
            this.el = $(options.el); // el为外部给的dom选择器，例如："#main", ".main"等
            //获取配置参数
            this._getUserRoleControl();
            this.userInfo=BaseComm.getUser();
            this.select_dep_id = this.userInfo.dep_id;
        },
        // 渲染方法，当外部需要加载模块时调用
        render: function() {
            this.el.html(mainTpl);
            this._renderDepTree();
            this._renderUserTable();
            this._bindEvent();
        },
        // 销毁模块方法，一般是删除模块的所有dom内容，以及删除所有相关的observer事件
        dispose: function() {},
        // 模块刷新方法
        refresh: function() {}
    };

    //渲染侧部门树面板
    UserManage.prototype._renderDepTree = function() {
        var _this = this;
        this.deptreePanel = new ESYS.deptreepanel({
            el: '#department_tree',
            events: {
                dataCallback: function(tree) {
                    tree.setValue(_this.userInfo.dep_id);
                },
                'click': function(data) {
                    _this.select_dep_id = data.dep_id;
                    _this.userTable.setParams({ dep_id: data.dep_id });
                    _this.userTable.reload();
                }
            }
        })
        this.deptreePanel.render();
    };

    //渲染角色列表
    UserManage.prototype._renderUserTable = function() {
        var _this = this;
        this.userTable = new ESYS.datatable({
            el: '#userTable',
            id: 'userTable',
            url: service.GET_USERS,
            params: {
				params: {dep_id: _this.userInfo.dep_id}
            },
            //autoLoad: false,
            checkbox: true,
            columns: [{
                    field: 'user_name',
                    title: '用户名称',
                    tpl: '<a href="javascript:void(0)" d-on-click="this.viewUser(item)">{item.user_name}</a>'
                },
                {
                    field: 'user_code',
                    title: '用户代码'
                },
                {
                    field: 'user_group',
                    title: '用户组',
                    orderable :true,
                    dict : true
                },
                {
                    field: 'dep_name',
                    title: '部门名称',
                    orderable :true
                },
                {
                    field: 'user_status',
                    title: '用户状态',
                    orderable :true,
                    dict : true
                },
                {
                    field: 'operate',
                    title: '操作',
                    locked: true,
                    width: '230',
                    /*    tpl: '<button type="button" class="btn btn-delete" d-on-click="module.deleteRole(item)"><i class="fa fa-close"></i>用户转移</button><span class="dropdown_wrapper"><i class="ctl_box">...'
                            +'<ul class="dropdown auto"><li  d-on-click="module._cancelStatus(item)">注销</li><li d-on-click="module._freezeStatus(item)>冻结</li><li d-on-click="module._normalStatus(item)>正常</li></ul></i></span>'*/
                    tpl: ' {this._renderStatusBtn(item)}'
                        //tpl: '<button type="button" d-on-click="this.test(item)" class="btn btn-delete"><i class="fa fa-close"></i>用户转移</button>'
                }
            ]
        }, this);
        this.userTable.render();

    };

    UserManage.prototype._renderStatusBtn = function(item) {
        //var html ='<button type="button" d-on-click="this.test()" class="btn btn-delete"><i class="fa fa-close"></i>用户转移</button><span class="dropdown_wrapper"><i class="ctl_box">';
        var html = '';
        if (item.user_status == '0') {
            html += '<button type="button" class="btn btn btn-edit" d-on-click="this._cancelStatus(item)">注销</button>';
            html += '<button type="button" class="btn btn btn-edit" d-on-click="this._freezeStatus(item)">冻结</button>';
            html += '<button type="button" class="btn btn btn-edit" d-on-click="this._resetPwd(item)">重置密码</button>';
        } else if (item.user_status == '2' || item.user_status == '3') {
            html += '<button type="button" class="btn btn btn-edit" d-on-click="this._normalStatus(item)">恢复正常</button>';
        }
        return html;
    };


    //查看用户
    UserManage.prototype.viewUser = function(data) {
        _this = this;
        var cov = new XyzCover({
            id: 'user_cover',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/UserTab'),
                options: {
                    user_code: data.user_code,
                    user_group: data.user_group,
                    user_status: data.user_status,
                    dep_id: data.dep_id,
                    userRoleControl: _this.userRoleControl
                }
            }
        });
        cov.render();
    }

    //注销
    UserManage.prototype._cancelStatus = function(item) {
            var _this = this;
            XyzAlert.info("确认注销该用户?", {
                showCancelButton: true,
                closeOnConfirm: true,
                closeOnCancel: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                confirm: function() {
                    _this._changeUserStatus(item.user_code, 1);
                }
            });

        }
        //冻结
    UserManage.prototype._freezeStatus = function(item) {
        var _this = this;
        XyzAlert.info("确认冻结该用户?", {
            showCancelButton: true,
            closeOnConfirm: true,
            closeOnCancel: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            confirm: function() {
                _this._changeUserStatus(item.user_code, 2);
            }
        });
    }
    //重置密码
    UserManage.prototype._resetPwd = function(item) {
        this._updatePwd(item);
    }
    UserManage.prototype._updatePwd = function(item) {
        var dialog = new ESYS.dialog({
            data: {
                width: 500,
                title: '重置密码',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/ResetPwd'),
                options: {
                    dialog: dialog,
                    user_code: item.user_code
                },
                buttons: [
                    { type: 'cancel' },
                    {
                        type: 'save',
                        title: '确定',
                        handler: function(dlg) {
                            var inst = this.getInstance();
                            var cb = function() {
                                dlg.close();
                            }
                            inst.save && inst.save(cb); //保存                          
                        }
                    }
                ]
            }
        }).render();;
    }
        //正常
    UserManage.prototype._normalStatus = function(item) {

        this._changeUserStatus(item.user_code, 0);
    }

    UserManage.prototype._changeUserStatus = function(user_code, status) {
        _this = this;
        $.jsonRPC.request({
            url: service.UPD_USER_STATUS,
            params: {
                params: {
                    user_code: user_code,
                    user_status: status
                }
            },
            success: function(response, url) {
                XyzAlert.info("修改成功");
                _this.userTable.setParams({
                    dep_id: _this.select_dep_id,
                });
                _this.userTable.reload();
            }
        });
    }


    UserManage.prototype._bindEvent = function() {
        var _this = this;
        //搜索框输入自动查询角色列表
        var timeoutId = null;
        function searchUsers() { //查找筛选角色
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            var text = $(this).val();
            timeoutId = setTimeout(function() {
                _this.userTable.setParams({
                    dep_id: _this.select_dep_id,
                    user_name: text
                });
                _this.userTable.reload();
            }, 500);
        }
        $('#user_search_input').bind('propertychange', searchUsers)
            .bind('input', searchUsers);
        Observer.on('User:refresh', function(data) {
            _this.userTable.reload();
        }, this);

        Observer.on('User:showrole', function(data) {
            //data 为 user_code
            _this._openRoleCover(data);
        }, this);

        $('#user-add').on('click', function() {
            _this._openAddCover();
        });

        $('#user-resetall').on('click', function() {

            var dialog = new ESYS.dialog({
                data: {
                    width: 500,
                    title: '全部重置密码',
                    url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/ResetPwdAll'),
                    options: {
                        dialog: dialog
                    },
                    buttons: [
                        { type: 'cancel' },
                        {
                            type: 'save',
                            title: '确定',
                            handler: function(dlg) {
                                var inst = this.getInstance();
                                var cb = function() {
                                    dlg.close();
                                }
                                inst.save && inst.save(cb); //保存
                            }
                        }
                    ]
                }
            }).render();
        });

        $('.showControl').on('click', function() {
            $(".control_status").style.display = "block";
        });


    };

    //打开coverlap， 进入新增角色步骤页面
    UserManage.prototype._openAddCover = function() {
        var _this = this;
        if (_this.addCov) {
            _this.addCov.dispose();
        }
        _this.addCov = new XyzCover({
            id: 'user_add_cover',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/child/UserInfoStep'),
                options: {
                    dep_id: _this.select_dep_id,
                    userTable: _this.userTable,
                    userRoleControl: _this.userRoleControl
                }
            }
        });
        _this.addCov.render();
    };

    UserManage.prototype._openRoleCover = function(userInfo){
        var _this = this;
        if (_this.addCov) {
            _this.addCov.dispose();
        }
        _this.addCov = new XyzCover({
            id: 'user_role_cover',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/child/UserRoleStep'),
                options: {
                    dep_id: _this.select_dep_id,
                    userTable: _this.userTable,
                    userRoleControl: _this.userRoleControl,
                    userCode: userInfo.userCode,
                    userGroup: userInfo.userGroup
                }
            }
        });
        _this.addCov.render();
    };

    //获取用户角色控制策略
    UserManage.prototype._getUserRoleControl = function() {
        var _this = this;
        $.jsonRPC.request(service.USER_ROLE_CONTROL, {
            params: {
                params: {
                    param_code: 'USER_ROLE_CONTROL'
                }
            },
            success: function(response) {
                var data = response.data;
                var value = data.param_val;
                _this.userRoleControl = $.isNumeric(value) ? parseInt(value) : 0;
            },
            error: function(response) {
                XyzAlert.error('页面加载出错，请重新访问该页面!');
                window.console && console.log('获取获取用户角色控制策略', response);
            }
        });
    };

    module.exports = UserManage;
});