define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        XyzAlert = require('xyz-alert');
    require('./UserRoleManage.css');

    var defaultUserRoleManage = require('./default/DefaultUserRoleManage');
    var customUserRoleManage = require('./custom/CustomUserRoleManage');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务地址
    var service = {
        GET_SYS_PARAM: SERVICE_GATEWAY + 'epframe.epbos_systemParamService.getParamByParamCode'
    };
    window.RoleGlobalSetting = {};//角色全局设置,用于存储一些系统参数

    var UserRoleManage = function(options) {
        this.initialize(options);
    };
    UserRoleManage.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this._initParams();
        }
    };

    UserRoleManage.prototype._initParams = function(){
        var _this = this;
        $.jsonRPC.request(service.GET_SYS_PARAM, {
            params: {
                params: {
                    param_code: 'USE_DEP_ROLE'
                }
            },
            success: function(response) {
                if(response.data.param_val === '1'){
                    new customUserRoleManage({
                        el: _this.el
                    }).render();
                }else{
                    new defaultUserRoleManage({
                        el: _this.el
                    }).render();
                }
            },
            error: function(response) {
                XyzAlert.error('页面加载出错，请重新访问该页面!');
                window.console && console.log('获取获取用户角色控制策略', response);
            }
        });
        $.jsonRPC.request(service.GET_SYS_PARAM, {
            params: {
                params: {
                    param_code: 'USER_ROLE_CONTROL'
                }
            },
            success: function(response) {
                var value = response.data.param_val;
                window.RoleGlobalSetting.USER_ROLE_CONTROL = $.isNumeric(value) ? parseInt(value) : 0;
            },
            error: function(response) {
                XyzAlert.error('页面加载出错，请重新访问该页面!');
                window.console && console.log('获取获取用户角色控制策略', response);
            }
        });
        //查询系统所有管理类菜单列表
        $.jsonRPC.request(SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryAllMgtMenus', {
            params: {},
            success: function(response) {
                window.RoleGlobalSetting.MGT_MENUS = response.data;
            }
        });
    }

    module.exports = UserRoleManage;
});