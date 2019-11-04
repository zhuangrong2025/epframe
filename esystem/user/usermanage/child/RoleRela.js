define(function(require, exports, module) {
    var _ = require('lodash'),
        $ = require('jquery'),
        xyzAlert = require('xyz-alert'),
        ESYS = require('../../../../public/common/ESYS');
        ESYS.require('transfer');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        ROLE_RELA: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryAllUserRoleRelasByUser',
        ROlE_LIST: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoles',
        SAVE_RELA: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRoleRelaByUser',
        MGT_USER_ROLES: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryAllMgtUserRoles'
    };


    var RoleRela = function(options) {
        this.initialize(options);
    };

    RoleRela.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            this.dep_id = options.dep_id;
            this.user_code = options.user_code;
            this.user_group = options.user_group;
            this.userRoleControl = options.userRoleControl;
            this.users = []; //当前部门所有用户列表
        },
        render: function() {
            var _this = this;
            this.transfer = new ESYS.transfer({
                el: this.el,
                key: 'role_id',
                text: '{role_name}',
                title: ['角色', '已选角色'],
                align: 'left',
                events: {
                    beforeMoveToRight: function(selections, leftBoxData, rightBoxData) {
                        if (_this.userRoleControl > 0 && (selections.length + rightBoxData.length) > _this.userRoleControl) {
                            xyzAlert.error('当前用户[' + _this.user_code + ']最多只能指定[' + _this.userRoleControl + ']个用户角色。');
                            return false;
                        }
                    }
                }
            })
            this.transfer.render();
            this._loadData();
        },
        dispose: function() {},
        refresh: function() {}
    };

    RoleRela.prototype._loadData = function() {
        var _this = this;
        $.jsonRPC.request(service.ROLE_RELA, {
            params: {
                params: {
                    user_code: _this.user_code
                }
            },
            success: function(response) {
                var data = response.data;
                //设置选中值
                _this.transfer.setValue(_.pluck(data, 'role_id'));
                //先设值，再加载Transfer数据，避免右框无值的情况发生
                $.jsonRPC.request(service.ROlE_LIST, {
                    params: {
                        params: {
                            dep_id: _this.dep_id,
                            role_name: ''
                        }
                    },
                    success: function(response) {
                        var data = response.data;
                        _this.transfer.load(data);
                        //如果是普通用户，则不能授权管理菜单的角色
                        if(_this.user_group === '3'){
                            _this._checkRoleControl(data);
                        }
                    }
                });
            }
        });
    };

    RoleRela.prototype._checkRoleControl = function(roles){
        var _this = this;
        $.jsonRPC.request(service.MGT_USER_ROLES, {
            params: {
                params: {}
            },
            success: function(response) {
                var list = response.data || [];
                if(!list.length) return; //没有用户达到最大角色数
                var roleIds = _.pluck(roles, 'role_id');
                var mgtIds = _.pluck(list, 'role_id');
                var sameRoleIds = _.intersection(roleIds, mgtIds);
                if(sameRoleIds && sameRoleIds.length) {//当前用户列表中包含用户拥有角色数到达最大限制数
                    var tips = '普通用户不能授予拥有管理菜单的角色';
                    _this.transfer.disableItems(sameRoleIds, {tips: tips});//达到最大角色限制数据的用户不允许继续选择
                }		
            },
            error: function(response) {
				xyzAlert.error('系统提示：页面加载失败，请重新打开此页面！');
				window.console && console.log('页面加载失败', response);
			}
        });
    };

    /*
     * 保存数据, dialog组件会调用该方法. 
     * cb为回调函数，保存成功后调用cb关闭对话框.
     */
    RoleRela.prototype.save = function(cb) {
        var _this = this;
        var roles = this.transfer.getValue();
        $.jsonRPC.request(service.SAVE_RELA, {
            params: {
                params: {
                    user_code: _this.user_code,
                    roles: roles
                }
            },
            success: function(response) {
                var data = response.data;
                cb && cb();
            }
        });
    }


    module.exports = RoleRela;
});