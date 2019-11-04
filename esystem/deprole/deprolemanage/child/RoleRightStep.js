define(function(require, exports, module) {
	var $ = require('jquery'),
        _ = require('lodash'),
        XyzAlert = require('xyz-alert'),
        ESYS = require('../../../../public/common/ESYS');
    ESYS.require('rolerightselect');

    require('xyz-jsonRPC')($);
    
    var tpl = require('./template/RoleRightStep.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        MENU_LIST : SERVICE_GATEWAY +'epframe.epbos_userRoleService.queryAllMenusByAppId'
    };
	var RoleRightStep = function(options) {
		this.initialize(options);
	};
    
	RoleRightStep.prototype = {
		initialize : function(options) {
			this.el = options.el;
		},
		render : function() {
            $(this.el).html(tpl);
            this._createSelector();
            //this._bindEvent();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };
    
    
    RoleRightStep.prototype._createSelector = function() {
        this.menuSelect = new ESYS.rolerightselect({
            el: '#dep_role_right_container',
            url : service.MENU_LIST
        });
        this.menuSelect.render();
    }

    /**
     * 以下方法是步骤条实例必须实现的方法, 保证步骤的正常操作.
     */
    //获取数据
    RoleRightStep.prototype.getData = function() {
        return this.menuSelect.getData();
    };
    //检验是否允许切换到下一步
    RoleRightStep.prototype.checkChange = function() {
        var data = this.menuSelect.getData();
        //只要任意一个系统有勾选权限即可进行下一步操作
        var isNext = false;
        $.each(data, function(idx, obj) {
            if(obj.length > 0){
                   isNext = true;
                   return ;
            }
        });
        if(!isNext){
            XyzAlert.info('请关联系统权限！');
        }       
        return isNext;
    };
	
	module.exports = RoleRightStep;
});