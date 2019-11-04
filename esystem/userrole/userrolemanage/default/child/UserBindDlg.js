define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        xyzAlert = require('xyz-alert'),
        XyzTreeselect = require('xyz-treeselect'),
        ESYS = require('../../../../../public/common/ESYS'),
        Transfer = require('/{WEB_NAME}/epframe/release/public/transfer/Transfer');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        USER_RELA : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoleRelas',
        USER_LIST : SERVICE_GATEWAY + 'epcum.epbos_userManageService.queryUsersByDepIds',
        COUNT_USER_ROLE_MAX: SERVICE_GATEWAY +'epframe.epbos_userRoleService.countUserRoleMax',
        ROLE_RIGHT : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryUserRoleRights',
        SAVE_RELA : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRoleRela',
        GET_USER_ROLE_NUM: SERVICE_GATEWAY +'epframe.epbos_userRoleService.getUserRoleNum',
        GET_ALL_DEP: SERVICE_GATEWAY + 'epcum.epbos_departmentService.queryAllDepts'
    };


	var UserBindDlg = function(options) {
        this.initialize(options);
	};

	UserBindDlg.prototype = {
		initialize : function(options) {
            this.el = $(options.el);
            this.role = options.role;
            this.users = [];//当前部门所有用户列表
            this.userRoleControl = options.userRoleControl;
		},
		render : function() {
            var _this = this;
            this.el.html('<div class=""><span class="condition_item_title">适用部门</span><div class="suit_dep_select_wrap"><div id="rela_user_dept_select"></div></div></div><div id="userTransfer" class="transfer_container"></div>');
            this._renderDepTreeSelect();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };

    UserBindDlg.prototype._renderDepTreeSelect = function(){
        var _this = this;
        $.jsonRPC.request(service.GET_ALL_DEP, {
            params: {
                params: {
                }
            },
            success: function(response) {
                var suitDepData = response.data.filter(function(item){
                    return _this.role.suit_dep_ids.indexOf(item.dep_id) >= 0;
                });

                _this.depTreeSelect = new XyzTreeselect({
                    el: '#rela_user_dept_select',
                    name: 'rela_user_dept_select',
                    multiple: true,
                    ajax: {
                        list: suitDepData,
                        id: 'dep_id',
                        pid: 'parent_dep_id',
                        text: 'dep_name',
                        url: '',
                    },
                    events: {
                        dataCallback: function(m) {
                            _this._renderTransfer();
                        },
                        change: function(val, valData){
                            if(val.length == 0){
                                _this.transfer.load([])
                            }else{
                                _this._loadData();
                            }
                        }
                    },
                    defaultValue: _this.role.suit_dep_ids
                });
                _this.depTreeSelect.render();
            }
        });
    }

    UserBindDlg.prototype._renderTransfer = function(){
        var _this = this;
        this.transfer = new Transfer({
            el: '#userTransfer',
            key: 'user_code',
            text: '{user_code}_{user_name}_{dep_name}<i data-code="{user_code}"></i>',
            title: ['用户', '已选用户'],
            align: 'left',
            events: {
                beforeMoveToRight: function(selections, leftBoxData, rightBoxData){
                    /* if(_this.userRoleControl > 0){
                        var wrong = [];
                        $.each(selections, function(index, item){
                            var countInfo = _this.roleCountInfos['' + item.user_code];
                            if(countInfo && (countInfo.role_count + 1) > _this.userRoleControl){
                                wrong.push(item.user_code);
                            }
                        });
                        if(wrong.length > 0){
                            xyzAlert.error('单个用户最多仅能指定[' + _this.userRoleControl + ']个用户角色。\n以下用户角色设置不符合要求：' + wrong.join(', '));
                            return false;
                        }
                    } */
                }
            }
        })
        this.transfer.render();
      //  this._loadData();
    };
    
    UserBindDlg.prototype._loadData = function() {
        var _this = this;
        $.jsonRPC.request(service.USER_LIST, {
            params: {
                params: {
                    dep_ids: this.role.suit_dep_ids
                }
            },
            success: function(response) {
                var users = response.data;
                _this.transfer.load(users);
                _this._checkMenuControl(users);
                window.RoleGlobalSetting.USER_ROLE_CONTROL && _this._checkRoleControl(users);
                _this._checkAbnormalUsers(users);
            }
        });
        _this._loadSelections();
    };
    UserBindDlg.prototype._loadSelections = function() {
        var _this = this;
        $.jsonRPC.request(service.USER_RELA, {
            params: {
                params: {
                    role_id: this.role.role_id
                }
            },
            success: function(response) {
                var transferValue = _.pluck(response.data || [], 'user_code');
                _this.transfer.setValue(transferValue);
            }
        });
    }

    //检查用户是否达到最大角色数限制，超出不允许分配
    UserBindDlg.prototype._checkRoleControl = function(users) {
        var _this = this;
        if(!window.RoleGlobalSetting.USER_ROLE_CONTROL) return;
        var userCodes = _.pluck(users, 'user_code');;
        //获取已到达最大角色数的用户列表
        $.jsonRPC.request(service.COUNT_USER_ROLE_MAX, {
            params: {
                params: {
                    control_num: window.RoleGlobalSetting.USER_ROLE_CONTROL
                }
            },
            success: function(response) {
                var list = response.data || [];
                if(!list.length) return; //没有用户达到最大角色数
                var codes = _.pluck(list, 'user_code');
                var sameCodes = _.intersection(userCodes, codes);
                if(sameCodes && sameCodes.length) {//当前用户列表中包含用户拥有角色数到达最大限制数
                    var tips = '用户最多只能授予' + window.RoleGlobalSetting.USER_ROLE_CONTROL + '个角色';
                    _this.transfer.setRule({type: 'MENU_CONTROL', list: _.pluck(sameCodes, 'user_code')});
                    _this.transfer.disableItems(sameCodes, {tips:tips});//达到最大角色限制数据的用户不允许继续选择
                }		
            },
            error: function(response) {
				xyzAlert.error('系统提示：页面加载失败，请重新打开此页面！');
				window.console && console.log('页面加载失败', response);
			}
        });
    }

    //检查角色是否有管理类菜单，普通用户不允许分配管理类菜单
    UserBindDlg.prototype._checkMenuControl = function(users) {
        var _this = this;
        $.jsonRPC.request(service.ROLE_RIGHT, {
            params: {
                params: {
                    role_id: this.role.role_id
                }
            },
            success: function(response) {
                //角色拥有的菜单列表
                var menus = response.data;
                var menuCodes = _.pluck(menus, 'menu_code');
                //管理类菜单列表
                var mgtMenus = window.RoleGlobalSetting.MGT_MENUS;
                var mgtMenuCodes = _.pluck(mgtMenus, 'menu_code');
                var sameCodes = _.intersection(menuCodes, mgtMenuCodes); //选中的管理类菜单
                if(sameCodes && sameCodes.length) {//当前角色包括管理类菜单权限时检查普通用户
                    var normalUsers = _.filter(users, function(user) {//筛选普通管理员
                        return user.user_group == '3';
                    });
                    if(normalUsers.length) {
                        _this.transfer.setRule({type: 'MENU_CONTROL', list: _.pluck(normalUsers, 'user_code')});
                        _this.transfer.disableItems(_.pluck(normalUsers, 'user_code'), {tips: '普通用户不允许分配管理权限'});//普通用户不允许分配管理权限
                    }
                }
            }
        });
    }

    //检查非正常状态用户，冻结、挂起用户不允许操作
    UserBindDlg.prototype._checkAbnormalUsers = function(users) {
        var frozenUsers = _.filter(users, function(user) {//筛选冻结用户
            return user.user_status == '2';
        });
        if(frozenUsers.length) {
            this.transfer.disableItems(_.pluck(frozenUsers, 'user_code'), {tips: '用户已冻结', locked: true});//用户已冻结不允许分配管理权限
        }
        var lockedUsers = _.filter(users, function(user) {//筛选挂起用户
            return user.user_status == '3';
        });
        if(lockedUsers.length) {
            this.transfer.disableItems(_.pluck(lockedUsers, 'user_code'), {tips: '用户已挂起', locked: true});//普通已挂起不允许分配管理权限
        }
    }

    /*
     * 保存数据, dialog组件会调用该方法. 
     * cb为回调函数，保存成功后调用cb关闭对话框.
     */
    UserBindDlg.prototype.save = function(cb) {
        if(!this.transfer.validateByRule(['ROLE_CONTROL', 'MENU_CONTROL'])) {
            xyzAlert.warning('系统提示：用户不符合授权要求！');
            return;
        }
        var users = this.transfer.getValue();
        $.jsonRPC.request(service.SAVE_RELA, {
            params: {
                params: {
                    role_id: this.role.role_id,
                    users: users
                }
            },
            success: function(response) {
                var data = response.data;
                cb && cb();
            }
        });
    };


	module.exports = UserBindDlg;
});