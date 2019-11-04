define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        XyzAlert = require('xyz-alert'),
        ESYS = require('../../../../../public/common/ESYS');
        ESYS.require('dialog');

    ESYS.require('datatable');
    
    var tpl = require('./template/UserBindTab.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=',
        TABLE_GATEWAY = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

    //服务网关地址
    var service = {
        USER_LIST : TABLE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoleRelas',
        DELETE_RELA : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.delUserRoleRela',
        GET_USER_ROLE_NUM: SERVICE_GATEWAY +'epframe.epbos_userRoleService.getUserRoleNum'
    };

	var UserBindTab = function(options) {
        this.initialize(options);       
	};

	UserBindTab.prototype = {
		initialize : function(options) {
            this.el = $(options.el);
            this.ctx = options.ctx; 
            this.role = options.role;
            this.users = [];//当前部门所有用户列表
		},
		render : function() {
            this.el.html(tpl);
            this._renderTable();
            this._checkUserRoleControl();
            this._bindEvent();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };
    
    UserBindTab.prototype._renderTable = function() {
        var _this = this;
        this.table = new ESYS.datatable({
            el: '#role_user_list',
            id: 'urserTable',
            url: service.USER_LIST,
            params: {
                params: {role_id: this.role.role_id}
            },
            checkbox: true,
            columns : [
                {
                    field: 'user_code',
                    title: '用户代码',
                    tpl: '{this.renderUserCode(item)}'
                },
                {
                    field: 'user_name',
                    title: '用户名称',
                    tpl: '{this.renderUserName(item)}'
                },
                {
                    field: 'dep_name',
                    title: '部门名称',
                    tpl: '{this.renderDepName(item)}'
                },
                {
                    field: 'operate',
                    title: '操作',
                    locked: true,
                    width: 100,
                    tpl: '{this.renderOperation(item)}'
                }
            ],
            events: {
                datacallback: function(module, data){
                    if(window.RoleGlobalSetting.USER_ROLE_CONTROL){
                        var userCodes = [];
                        var doms = module.el.find('[table_id=' + module.settings.id + ']').find('span.special_column');
                        for(var i=0; i<data.length; i++){
                            userCodes.push(data[i].user_code);
                            data[i].user_status == '1' && doms.filter('[data-code=' + data[i].user_code + ']').addClass('esys-disabled').attr('title','用户已注销');
                        }
                        _this._getUserRoleNum(userCodes, function(roleInfos){                            
                            $.each(roleInfos, function(index, role){                               
                                if(role.role_count > window.RoleGlobalSetting.USER_ROLE_CONTROL){
                                    doms.filter('[data-code=' + role.user_code + ']').addClass('error');
                                }
                            });
                        });
                    }
                }
            }
        }, this);
        this.table.render();
    };

    //渲染用户代码
    UserBindTab.prototype.renderUserCode = function(item) {
        return '<span class="special_column" data-code="' + item.user_code + '">' + item.user_code + '</span>';
    };

    //渲染用户名称
    UserBindTab.prototype.renderUserName = function(item) {
        return '<span class="special_column" data-code="' + item.user_code + '">' + item.user_name + '</span>';
    };

    //渲染部门名称
    UserBindTab.prototype.renderDepName = function(item) {
        return '<span class="special_column" data-code="' + item.user_code + '">' + item.dep_name + '</span>';
    };
    //渲染操作
    UserBindTab.prototype.renderOperation = function(item) {
        if(item.user_status == '1') {//用户注销
            return '<button type="button" class="btn btn-delete" title="用户已注销" disabled>解除用户</button>';
        } else {
            return '<button type="button" class="btn btn-delete" d-on-click="this.deleteUser(item)">解除用户</button>';
        }
    };

    //解除用户绑定
    UserBindTab.prototype.deleteUser = function(user) {
        var _this = this,
            role_id = this.role.role_id,
            user_code = user.user_code;
        function doDelete() {//执行删除操作
            $.jsonRPC.request(service.DELETE_RELA, {
                params: {
                    params: {
                        role_id: role_id,
                        user_code: user_code
                    }
                },
                success: function(response) {
                    var data = response.data;
                    _this.table.reload();//刷新表格数据
                }
            });
        }
        XyzAlert.info("确认解除该用户", {
            showCancelButton: true,
            closeOnConfirm: true,
            closeOnCancel: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            confirm: doDelete
        });
    };
    
    UserBindTab.prototype._bindEvent = function() {
        var _this = this;
        $('#user_rela_btn').click(function() {
            var dialog = new ESYS.dialog({
                data: {
                    width: 960,
                    title: '关联用户',
                    url : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/custom/child/UserBindDlg'),
                    options : {
                        role: _this.role
                    },
                    buttons: [
                        {type: 'cancel'},
                        {type: 'save', title: '确定', handler: function(dlg) {
                            var inst = this.getInstance();
                            var cb = function() {
                                _this.table.reload();
                                dlg.close();
                            }
                            inst.save && inst.save(cb);//保存
                        }}
                    ]
                }
            });
            dialog.render();
        });
    };

    //获取用户角色数
    UserBindTab.prototype._getUserRoleNum = function(user_code, callback) {
        var _this = this;
        $.jsonRPC.request(service.GET_USER_ROLE_NUM, {
            params: {
                params: {
                    dep_id: _this.role.dep_id,
                    user_code: user_code.join(',')
                }
            },
            success: function(response) {
                callback(response.data);				
            }
        });
    };

    //用户角色策略检查
	UserBindTab.prototype._checkUserRoleControl = function() {
		if(window.RoleGlobalSetting.USER_ROLE_CONTROL){
			this.el.find('.special_message').addClass('show').find('span').html('用户所指定的角色数量不得超过[' + window.RoleGlobalSetting.USER_ROLE_CONTROL + ']个，列表中标红的用户表示违反了该策略');
		}
	};

	module.exports = UserBindTab;
});