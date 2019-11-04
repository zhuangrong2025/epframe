define(function(require, exports, module) {
	var $ = require('jquery'),
        _ = require('lodash'),
		XyzZtree = require('xyz-ztree'),
		XyzAlert = require('xyz-alert'),
		observer = require('observer'),
		BaseComm = require('base-common-module');
	
	require('xyz-jsonRPC')($);
    var tpl = require('./template/RoleDepRelate.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
		GET_DEPART_TREE: SERVICE_GATEWAY + 'esystem.getDepInfo',
		BIND_ROLE_DEP_INFO :SERVICE_GATEWAY + 'epframe.epbos_deptRoleService.bindRoleDep'
        
    };
	var RoleDepRelate = function(options) {
		this.initialize(options);
	};

	RoleDepRelate.prototype = {
		initialize : function(options) {
			this.el = options.el;
			//从缓存读取用户信息
			this.userInfo=BaseComm.getUser();
			//全局变量
			this.depTree;
			this.role_id = options.role_id;
			console.log("this.role_id="+this.role_id);
		},
		render : function() {
			$(this.el).html(tpl);
			this._getDepTree();
			this._bindEvent();
		},
		dispose : function() {
		},
		refresh : function() {
		}
	};
	RoleDepRelate.prototype._getDepTree = function() {
        var _this = this;
        //销毁部门树
        if (null != _this.depTree) {
            _this.depTree.dispose();
        }
        var serviceUrl = service.GET_DEPART_TREE;
        var serviceArg = {};
        //操作用户
        serviceArg.OP_USER_CODE = _this.userInfo.user_code;
        //只显示操作用户所在的部门及其子部门
		serviceArg.DEP_ID = _this.userInfo.dep_id;
        _this.depTree = new XyzZtree({
			el: '#depBindTree',
			multiple: true, 
            ajax: {
                id: 'DEP_ID',
                pid: 'PARENT_DEP_ID',
                text: 'DEP_NAME',
                url: serviceUrl,
                params: {
                    params: serviceArg
                }
            },
			formatData: function(data) { // 格式化服务端返回的数据后，做树的初始化
				return data;
			},
			events: {
				click: function(val, valData, _m) {
					
				},
				dataCallback: function(_m) {
					// 自动展开部门树
					_m.getSource().expandAll(true);
				}
			}
        });
        _this.depTree.render();
	};
	//按钮触发事件
	RoleDepRelate.prototype._bindEvent = function(){
		var _this =this;
		//取消
		$("#depBindCancel").click(function(){
			//_this._exit();
		})
		//保存
		$("#depBinddSave").click(function(){
				var serviceArg = {};
				var depList = _this.depTree.getValue();
				serviceArg.role_id = this.role_id;
				serviceArg.dep_id = depList;//多个dep_id是数组形式				
				//保存
				//service.BIND_ROLE_DEP_INFO 接口未实现 ，使用json文件替代
				$.jsonRPC.request("data/dep.json", {
					params: {
						params: serviceArg
					},
					success: function(response) {
						//$("#cancellation").attr("disabled", true);
						XyzAlert.success('系统提示：部门绑定成功！');
					},
					error: function(response) {
						XyzAlert.error('系统提示：部门绑定失败！' + (response.desc ? '[' + response.desc + ']' : ''));
						window.console && console.log('部门绑定失败', response);
						//注销开关重置
						//_this.depInfoCache.DEP_STATUS = oldStatus;
						//注销开关
						//$("#cancellation").attr("disabled", false);
					}
				});

		})
    };



	module.exports = RoleDepRelate;
});