define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        xyzAlert = require('xyz-alert'),
        ESYS = require('../../../../public/common/ESYS');
        ESYS.require('transfer');

	require('xyz-jsonRPC')($);
    var tpl = require('./template/UserRoleStep.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        ROLE_LIST : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoles',
        SAVE_RELA: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRoleRelaByUser',
        MGT_USER_ROLES: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryAllMgtUserRoles'
    };

	var UserRoleStep = function(options) {
		this.initialize(options);
	};

	UserRoleStep.prototype = {
		initialize : function(options) {
            this.el = $(options.el);
            this.ctx = options.ctx;
            this.dep_id = options.dep_id;
            this.userRoleControl = options.userRoleControl;
            this.user_code = options.userCode;
            this.user_group = options.userGroup;
            this.users = [];//当前部门所有用户列表
		},
		render : function() {
            this.el.html(tpl);
            this._createElements();
            this._bindEvent();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };
    
    UserRoleStep.prototype._createElements = function() {
        var _this = this;
        this.transfer = new ESYS.transfer({
            el: '#role_transfer',
            key: 'role_id',
            text: '{role_name}',
            title: ['角色', '已选角色'],
            align: 'left',
            events: {
                beforeMoveToRight: function(selections, leftBoxData, rightBoxData){
                    if(_this.userRoleControl > 0 && (selections.length + rightBoxData.length) > _this.userRoleControl) {
                        xyzAlert.error('新增用户最多只能指定[' + _this.userRoleControl + ']个用户角色。');
                        return false;
                    }
                }
            }
        })
        this.transfer.render();
        var dep_id = this.dep_id;
        if(!dep_id && this.ctx) {
            var data = this.ctx.getStepData(0);//取第一步的数据
            dep_id = data.dep_id;
        }
        $.jsonRPC.request(service.ROLE_LIST, {
            params: {
                params: {
                    dep_id: dep_id
                }
            },
            success: function(response) {
                var data = response.data;
                _this.roles = data;
                _this.transfer.load(data);
                //如果是普通用户，则不能授权管理菜单的角色
                if(_this.user_group === '3'){
                    _this._checkRoleControl(data);
                }
            }
        });
    };

    UserRoleStep.prototype._checkRoleControl = function(roles){
        var _this = this;
        $.jsonRPC.request(service.MGT_USER_ROLES, {
            params: {
                params: {
                    
                }
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

    UserRoleStep.prototype._bindEvent = function(){
        var _this = this;
        $('#userRoleSave').on('click', function(){
            var roles = _this.getData();
            $.jsonRPC.request(service.SAVE_RELA, {
                params: {
                    params: {
                        user_code: _this.user_code,
                        roles: roles
                    }
                },
                success: function(response) {
                    xyzAlert.success('保存成功!');
                    _this._exit();
                }
            });
        });

        $('#userRoleCancel').on('click', function(){
            _this._exit();
        });
    };

    UserRoleStep.prototype._exit = function(){
        var cov = window.XyzCoverlap && window.XyzCoverlap.user_role_cover;
        cov && cov.dispose();
    }

    /**
     * 以下方法是步骤条实例必须实现的方法, 保证步骤的正常操作.
     */
    //获取数据
    UserRoleStep.prototype.getData = function() {
            return this.transfer.getValue();
    };
    //检验是否允许切换到下一步
    UserRoleStep.prototype.checkChange = function() {
        return true;
    };

	module.exports = UserRoleStep;
});