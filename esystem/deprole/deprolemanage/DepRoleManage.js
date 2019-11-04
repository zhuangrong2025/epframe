define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        XyzTab = require('xyz-tab'),
        XyzCover = require('xyz-coverlap'),
        XyzAlert = require('xyz-alert'),
        BaseComm = require('base-common-module'),
        ESYS = require('../../../public/common/ESYS');
    
    ESYS.require('datalist');
    var PermissionControl = require('../../../public/permissioncontrol/PermissionControl');

    require('xyz-jsonRPC')($);
    //require('bootstrap-maxlength')($);
    //模板引入
    var mainTpl = require('./template/main.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=',
        PAGE_SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/dataTables.do?service='

    var service = {
        GET_ROLE_LIST : PAGE_SERVICE_GATEWAY +'epframe.epbos_deptRoleService.queryDepRoleList',
        DEL_DEP_ROLE:SERVICE_GATEWAY +'epframe.epbos_deptRoleService.delDepRole',
        VALID_DEP_ROLE_RELA: SERVICE_GATEWAY+ 'epframe.epbos_deptRoleService.existDepRoleRela'
    };

    var DepRoleManage = function (options) {
        this.initialize(options);
    };
    DepRoleManage.prototype = {
        initialize: function (options) {
            this.el = options.el;
            this.userInfo=BaseComm.getUser();
        },
        render: function () {
            //登录用户是否有访问权限
            var permission = new PermissionControl({
                userGroup: ['1']
            });
            if(!permission.allow()){
                return false;    //无权限不允许继续访问
            }
            $(this.el).html(mainTpl);       
            this._createRoleList();
            this._createRoleTab();
            this._bindEvent();
        },
        dispose: function () {
        },
        refresh: function () {
        }
    };

    DepRoleManage.prototype._createRoleList = function() {
        var _this = this,dep_id = _this.userInfo.dep_id;
        this.roleList = new ESYS.datalist({
            el: '#role_side_list',
            data: {
                title: '角色名称',
                button:  true,
                url: service.GET_ROLE_LIST, //列表数据获取地址
                key: 'role_id',
                keyword: 'role_name',//搜索关键字
                text: 'role_name',
                pagination: true,
                params:{
                    dep_id :dep_id
                }
            },
            events: {
                click: function(data) {
                    var change =  _this.role && _.isEqual(_this.role, data) ? false : true;
                    _this.role = data;
                    //针对RoleInfoTab页面的事件触发
                    Observer.trigger('deprole:click', data, change);        
                },
                add: function() {
                    _this._openAddCover();;
                } ,
                delete: function(data) {
                    var _that = this;
                    XyzAlert.info("确认删除该部门角色", {
                        showCancelButton: true,
                        closeOnConfirm: true,
                        closeOnCancel: true,
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        confirm: function() {
                        	 //1.验证部门角色是否被关联  2.没有被关联执行删除
                        	 $.jsonRPC.request(service.VALID_DEP_ROLE_RELA, {
                                 params: {
                                     params: {
                                    	 role_id: data.role_id
                                     }
                                 },
                                 success: function(response) {
                                 	var flag  = response.data; 
                                 	if (flag){
                                 		XyzAlert.info("部门角色已被赋予部门，无法删除"); 
                                 	}else{
                                 		//执行删除
                                 		 $.jsonRPC.request(service.DEL_DEP_ROLE, {
                                             params: {
                                                 params: {
                                                     role_id: data.role_id
                                                 }
                                             },
                                             success: function(response) {
                                                _that.reload();
                                                var rolelist = _that.data,
                                                    len = 0;//部门角色个数
                                                $.each(rolelist, function(i, val) {//排除删除缓存数据
                                                    if(data != val){                                                      
                                                        len++;
                                                    }                                 
                                                });
                                                if(len == 0){
                                                    Observer.trigger('DepInfodelete', true);//通知部门角色全部删除
                                                    _this.role = "";
                                                }                                                
                                             },
                                             error: function(response) {
                                                 
                                             }
                                         });	
                                 	} 
                                 } 
                             });  
                        }
                    });                    
                } 
            }
        });
        this.roleList.render();
    } 
    //绑定事件
    DepRoleManage.prototype._bindEvent = function() {
        var _this = this;
        Observer.on('DepRole:updateItem', function(data){			
            //仅更新修改项
            _this.roleList.updateItem(data);
        }, this);
        Observer.on('DepRole:refresh', function(data){			
            //刷新角色列表
            _this.roleList.reload();
        }, this);
    }
    DepRoleManage.prototype._createRoleTab = function() {
        var _this = this;
		// 切换tab
		this.tabTag = new XyzTab({
			el : '#roleright_content',
			config : [ {
				id : 'tab1',
				title : '基本信息',
				child : {
					path : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/child/RoleInfoTab'),
					options : function() {
                        return {role: _this.role}
                    }
				}
			}, {
				id : 'tab2',
				title : '功能权限',
				child : {
					path : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/child/RoleRightTab'),
					options : function() {
                        return {role: _this.role}
                    }
				}
			}, {
				id : 'roleDepTab',
				title : '已关联部门',
				child : {
					path : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/child/RoleDepTab'),
					options : function() {
                        return {role: _this.role}
                    }
				}
			}],
			events: {
				change: function(id, tab){     //tab页切换完成的事件函数
					var inst = tab.getInstanceById(id);
					inst.doActive && inst.doActive(tab);
				}
			}
		});
		this.tabTag.render();
	}
    //打开coverlap， 进入新增角色步骤页面
    DepRoleManage.prototype._openAddCover = function() {
        var cov = new XyzCover({
            id: 'dep_role_add_cover',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/DepRoleAdd')
            }
        });
        cov.render();
    };    
    module.exports = DepRoleManage;
});