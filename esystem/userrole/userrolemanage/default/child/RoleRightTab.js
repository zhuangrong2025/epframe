define(function(require, exports, module) {
	var $ = require('jquery'),
        _ = require('lodash'),
        xyzAlert = require('xyz-alert'),
        ESYS = require('../../../../../public/common/ESYS');
        ESYS.require('rolerightselect');

    require('xyz-jsonRPC')($);
    
    var tpl = require('./template/RoleRightStep.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        MENU_LIST : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryMenusByAppId',
        ROLE_RIGHT : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoleRights',
        SAVE_RIGHT : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRoleRight',
        ROLE_USERS : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoleRelas'
    };
	var RoleRightTab = function(options) {
		this.initialize(options);
	};
    
	RoleRightTab.prototype = {
		initialize : function(options) {
            this.el = options.el;
            this.role_id = options.role_id;
            this.dep_id = options.dep_id;
            this.users = [];
		},
		render : function() {
            $(this.el).html(tpl);
            this._createSelector();
            this._initRelas();
			//this._bindEvent();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };

    RoleRightTab.prototype._initRelas = function() {
        var _this = this;
        $.jsonRPC.request(service.ROLE_USERS, {
            params: {
                params: {
                    role_id: this.role_id
                }
            },
            success: function(response) {
                var users = response.data;
                _this.users = users;
            }
        });
    }
    
    RoleRightTab.prototype._createSelector = function() {
        var roleId = this.role_id;
        var _this = this;
        this.menuSelect = new ESYS.rolerightselect({
            el: '#role_right_container',
            role_id: this.role_id,
            dep_id:this.dep_id,
            url : {
                menus: service.MENU_LIST,
                roleright: service.ROLE_RIGHT,
                save: service.SAVE_RIGHT
            },
            beforesave: function(rs, data) {
                var mgtMenus = window.RoleGlobalSetting.MGT_MENUS;
                var mgtMenuCodes = _.pluck(mgtMenus, 'menu_code');
                var selectedMenus = [];
                for(var appId in data)  {
                    selectedMenus = selectedMenus.concat(data[appId]);
                }
                var sameCodes = _.intersection(selectedMenus, mgtMenuCodes); //选中的管理类菜单
                if(sameCodes && sameCodes.length) {//当前角色包括管理类菜单权限时检查普通用户
                    var normalUsers = _.filter(_this.users, function(user) {//筛选普通管理员
                        return user.user_group == '3';
                    });
                    if(normalUsers.length) {
                        xyzAlert.warning('系统提示：已关联普通用户，不允许分配管理权限！');
                        return false;
                    }
                }
                return true;
            }
        });
        this.menuSelect.render();
    }

	
	module.exports = RoleRightTab;
});