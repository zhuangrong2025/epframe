define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        xyzAlert = require('xyz-alert'),
        XyzTreeselect = require('xyz-treeselect'),
        ESYS = require('../../../../../public/common/ESYS'),
        Transfer = require('/{WEB_NAME}/epframe/release/public/transfer/Transfer');
	require('xyz-jsonRPC')($);
    var tpl = require('./template/UserBindStep.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        GET_USER_ROLE_NUM: SERVICE_GATEWAY +'epframe.epbos_userRoleService.getUserRoleNum',
        COUNT_USER_ROLE_MAX: SERVICE_GATEWAY +'epframe.epbos_userRoleService.countUserRoleMax',
        DEP_TREE: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryDepsByRoleId',
        USER_LIST: SERVICE_GATEWAY + 'epcum.epbos_userManageService.queryUsersByDepIds',
        //SAVE_RELA : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRoleUnited'
        SAVE_RELA : SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRoleRight'
    };
    //用户选择方式定义
    var USER_BIND_TYPE = { 
        ALL_USER: '1', //部门下的所有用户
        SELECT_USER: '2' //部门下的指定用户
    }

	var UserBindStep = function(options) {
		this.initialize(options);
	};

	UserBindStep.prototype = {
		initialize : function(options) {
            this.el = $(options.el);
            this.ctx = options.ctx;
            this.users = [];//当前部门所有用户列表
            this.userRoleControl = options.userRoleControl;
            var step1Data = this.ctx.getStepData(0); //取第一步的数据
            this.suitDeptIds = step1Data.dep_ids;
            this.suitDeptItems = step1Data.suitDeptsData;
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
    
    UserBindStep.prototype._createElements = function() {
        var _this = this;
        
        this.depTreeSelect = new XyzTreeselect({
            el: '#rela_user_dept_select',
            name: 'rela_user_dept_select',
            multiple: true,
            ajax: {
                list: _this.suitDeptItems,
                id: 'dep_id',
                pid: 'parent_dep_id',
                text: 'dep_name',
                url: '',
            },
            events: {
                dataCallback: function(m) {
                    
                },
                change: function(val, valData){
                    if(val.length == 0){
                        _this.transfer.load([])
                    }else{
                        _this.load();
                    }
                }
            },
            defaultValue: _this.suitDeptIds
        });
        this.depTreeSelect.render();

        this.transfer = new Transfer({
            el: '#user_transfer',
            key: 'user_code',
            text: '{user_name}({dep_name})<i data-code="{user_code}"></i>',
            title: ['用户', '已选用户'],
            align: 'left',
            events: {
                /* beforeMoveToRight: function(selections, leftBoxData, rightBoxData){
                    if(_this.userRoleControl > 0){
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
                    }
                } */
            }
        })
        this.transfer.render();
        this.load();
    };

    //加载数据
    UserBindStep.prototype.load = function() {
        var _this = this;
        if(this.transfer){
            var dep_ids = _this.depTreeSelect.getValue(); 
            $.jsonRPC.request(service.USER_LIST, {
                params: {
                    params: {
                        dep_ids: dep_ids
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
        }
    };

    //检查用户是否达到最大角色数限制，超出不允许分配
    UserBindStep.prototype._checkRoleControl = function(users) {
        var _this = this;
        if(!window.RoleGlobalSetting.USER_ROLE_CONTROL) return;
        var userCodes = _.pluck(users, 'user_code');
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
                    _this.transfer.disableItems(sameCodes, {tips:tips});//达到最大角色限制数据的用户不允许继续选择
                }		
            },
            error: function(response) {
				xyzAlert.error('系统提示：页面加载失败，请重新打开此页面！');
				window.console && console.log('页面加载失败', response);
			}
        });
        /* _this._getUserRoleNum(userCode, function(foundBeyond){
            _this._configTransfer(users);
            if(foundBeyond){
                _this.el.find('input[name=user_bind_type]').prop('disabled', true).filter('[value=2]').prop('checked', true);
                _this.el.find('.special_message').addClass('show_block')
                    .find('span').html('已有用户达到[' + _this.userRoleControl + ']个用户角色设置限制，您只能手动设置用户');
                $('#user_transfer').removeClass('hide');
            }else{
                _this.el.find('input[name=user_bind_type]').prop('disabled', false);
                _this.el.find('.special_message').removeClass('show_block');
            }
        }); */
    }

    //检查角色是否有管理类菜单，普通用户不允许分配管理类菜单
    UserBindStep.prototype._checkMenuControl = function(users) {
        var _this = this;
        var mgtMenus = window.RoleGlobalSetting.MGT_MENUS;
        var mgtMenuCodes = _.pluck(mgtMenus, 'menu_code');
        var setp2Data = this.ctx.getStepData(1);  //取第二步的数据
        var selectedMenus = [];
        for(var appId in setp2Data)  {
            selectedMenus = selectedMenus.concat(setp2Data[appId]);
        }
        var sameCodes = _.intersection(selectedMenus, mgtMenuCodes); //选中的管理类菜单
        if(sameCodes && sameCodes.length) {//当前角色包括管理类菜单权限时检查普通用户
            var normalUsers = _.filter(users, function(user) {//筛选普通管理员
                return user.user_group == '3';
            });
            if(normalUsers.length) {
                _this.transfer.disableItems(_.pluck(normalUsers, 'user_code'), {tips: '普通用户不允许分配管理权限'});//普通用户不允许分配管理权限
            }
        }
    }

    //检查非正常状态用户，冻结、挂起用户不允许操作
    UserBindStep.prototype._checkAbnormalUsers = function(users) {
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

    UserBindStep.prototype._bindEvent = function() {
        var _this = this;
        //取消
        $("#userBindCancel").click(function() {
            _this._exit();
        });

        //保存
        $("#userBindSave").click(function() {
            _this._saveUserBind();
        });
    };

    UserBindStep.prototype._exit = function(){
        var cov = window.XyzCoverlap && window.XyzCoverlap.userBind;
        cov && cov.dispose();
    };

    UserBindStep.prototype._saveUserBind = function(){
        var _this = this;
        var users = this.transfer.getValue();
        $.jsonRPC.request(service.SAVE_RELA, {
            params: {
                params: {
                    role_id: _this.userRoleId,
                    users: users
                }
                /* params: {
                    role: {
                        role_id: _this.userRoleId,
                    },
                    users: users
                } */
            },
            success: function(response) {
                xyzAlert.success('保存成功!');
                _this._exit();
            }
        });
    };
	
    /**
     * 以下方法是步骤条实例必须实现的方法, 保证步骤的正常操作.
     */
    //获取数据
    UserBindStep.prototype.getData = function() {
        var _this = this;
        var select_type = this.el.find('input[name=user_bind_type]:checked').val();
        if(select_type === '1') {//选择部门的所有用户
            return _.pluck(this.users, 'user_code');            
        } else {
            return this.transfer.getValue();
        }
    };
    //检验是否允许切换到下一步
    UserBindStep.prototype.checkChange = function() {
        return true;
    };

	module.exports = UserBindStep;
});