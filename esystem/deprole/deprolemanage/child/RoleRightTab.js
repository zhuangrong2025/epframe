define(function(require, exports, module) {
	var $ = require('jquery'),
        _ = require('lodash'),
        observer = require('observer'),
        ESYS = require('../../../../public/common/ESYS');
        ESYS.require('rolerightselect');

    require('xyz-jsonRPC')($);

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        MENU_LIST : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryAllMenusByAppId',
        ROLE_RIGHT : SERVICE_GATEWAY + 'epframe.epbos_deptRoleService.queryDepRoleRight',
        SAVE_RIGHT : SERVICE_GATEWAY + 'epframe.epbos_deptRoleService.setDepRoleRight'
    };
	var RoleRightTab = function(options) {
		this.initialize(options);
	};
    
	RoleRightTab.prototype = {
		initialize : function(options) {
            this.el = options.el;
            this.role = options.role || "";
		},
		render : function() {
            this._createSelector();
            this._bindEvents();
		},
		dispose : function() {
            this.menuSelect.dispose && this.menuSelect.dispose();
            $(this.el).empty();
		},
		refresh : function() {
            this.dispose();
			this.render()
		}
    };
    
    RoleRightTab.prototype._createSelector = function() {
        this.menuSelect = new ESYS.rolerightselect({
            el: this.el,
            role_id: this.role.role_id || -1,
            url : {
                menus: service.MENU_LIST,
                roleright: service.ROLE_RIGHT,
                save: service.SAVE_RIGHT
            }
        });
        this.menuSelect.render();
    }

    RoleRightTab.prototype._bindEvents = function() {       
        var _this = this;  
        /*部门角色列表为空时，无权限且不允许修改 */
        if(!_this.role){
            this.menuSelect && _this.dispose();
            _this._createSelector();
            $(".btn-edit").attr("disabled",true);
        }
		observer.on('deprole:click', function(data, change) {
			if(change) {
                _this.role = data;
                _this.dispose();
                _this._createSelector();
                $(".btn-edit").attr("disabled",false);
			}
        });
        /**删除最后一个部门角色时监听**/
        observer.on('DepInfodelete', function(data) {
            _this.role = "";
            _this.dispose();
            _this._createSelector();
            $(".btn-edit").attr("disabled",true);
        });
    }
	
	module.exports = RoleRightTab;
});