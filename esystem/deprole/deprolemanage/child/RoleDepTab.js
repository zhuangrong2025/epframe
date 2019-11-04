define(function(require, exports, module) {
	var $ = require('jquery'),
        _ = require('lodash'),
		XyzAlert = require('xyz-alert'),
		XyzCover = require('xyz-coverlap'),
		observer = require('observer'),
        ESYS = require('../../../../public/common/ESYS');
    ESYS.require('datatable', 'dialog');

	require('xyz-jsonRPC')($);
    //服务网关前缀
	var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=',
		TABLE_GATEWAY = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

    var service = {
		GET_DEP_INFO: TABLE_GATEWAY + 'epframe.epbos_deptRoleService.queryDepOfDepRole',//查询部门角色关联部门
		DEL_DEP_ROLE_RELA:SERVICE_GATEWAY + 'epframe.epbos_deptRoleService.delDepRoleRela'//解除绑定
        
	};
	var tpl = require('./template/RoleDepTab.html');
	var RoleDepTab = function(options) {
		this.initialize(options);
	};

	RoleDepTab.prototype = {
		initialize : function(options) {
			this.el = $(options.el);
			//全局变量
			this.role = options.role || "";	

		},
		render : function() {
			this.el.html(tpl);
			this._createDepTable();
			this._bindEvent();						
		},
		dispose : function() {
			this.depTable.dispose();
			this.el.empty();
		},
		refresh : function() {
			this.dispose();
			this.render();
		},
		doActive : function(tab) {
			if(!this.tab) {
				this.tab = tab;
			}
			if(this.hasChange) {
				this.depTable.setParams({role_id: this.role.role_id});
				this.depTable.reload();
				$("#relate").attr("disabled",false);
				this.hasChange = false;
			}
		}
	};
	RoleDepTab.prototype._createDepTable = function(){
		var _this = this;
		this.depTable = new ESYS.datatable({
			height: 500,
		//this.depTable = new DataTable({
			el: "#divTable", //div容器
			id: 'depTable', //表格id，必填
			url: service.GET_DEP_INFO,
			params: {
				params: {role_id: this.role.role_id || -1,}
			},
			columns: [
				{
					title: "部门代码",
					field: "dep_code",
					width: "90"

				},
				{
					title: "部门名称",
					field: "dep_name"
				},
				{
					field: 'operate',
					title: '操作',
					locked: true,
					width: 100,
					tpl: '<button type="button" class="btn btn-delete" d-on-click="this.deleteDep(item)"><i class="fa fa-close"></i> 解除</button>'
				}
			],
			events: {
				dataCallback: function() {
					$("#divTable td a").popover({
						html: true
					}); // 注：popover要指定td下的a标签， 否则会影响下载，打印等按钮的样式
				}
			}
		},this);
		this.depTable.render();

	}

	RoleDepTab.prototype.deleteDep = function(data){
		if (_.isEmpty(data)) {
			XyzAlert.info('未选择解除数据！！');
			return;
		}
		var _this = this;
		function doDelete() {//执行删除操作
            $.jsonRPC.request(service.DEL_DEP_ROLE_RELA, {
                params: {
                    params: {
						role_id: _this.role.role_id,
						dep_id: data.dep_id
                    }
                },
                success: function(response) {
                    XyzAlert.success('系统提示：解除绑定成功！');
                    _this.depTable.reload();//重新加载网格数据
                },
				error: function(response) {
					XyzAlert.error('系统提示：部门角色解除绑定失败！' + (response.desc ? '[' + response.desc + ']' : ''));
					window.console && console.log('部门角色解除绑定失败', response);
				}
            });
        }
		XyzAlert.info("确认解除该关系", {
			showCancelButton: true,
			closeOnConfirm: true,
			closeOnCancel: true,
			confirmButtonText: '确定',
			cancelButtonText: '取消',
			confirm: doDelete
		});
	}

	RoleDepTab.prototype._bindEvent = function(){
		var _this = this;
		/*部门角色列表为空时，不允许进行关联部门操作 */
		if(!_this.role){
			$("#relate").attr("disabled",true);
		}
		//关联部门按钮实现
		$('#relate').on('click', function() {
			if(!_this.role.role_id){
				XyzAlert.info('请先创建部门角色！');
				return;
			}
			new ESYS.dialog({
                data: {
					title: '关联部门',
					height: 400,
                    url : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/child/DepBindDlg'),
                    options : {
                        role: _this.role
                    },
                    buttons: [
                        {type: 'cancel'},
                        {type: 'save', title: '确定', handler: function(dlg) {
                            var inst = this.getInstance();
                            var cb = function() {
                                _this.depTable.reload();
                                dlg.close();
                            }
                            inst.save && inst.save(cb);//保存
                        }}
                    ]
                }
            }).render();	
		});	
		observer.on('deprole:click', function(data, change) {
			if(change){
				_this.role = data;
				if(_this.tab.getCurrentCheckId() == 'roleDepTab') {//判断是否为当前tab页，是则直接刷新
					_this.depTable.setParams({role_id: data.role_id});
					_this.depTable.reload();
					$("#relate").attr("disabled",false); 
					_this.hasChange = false;
				} else {
					_this.hasChange = true;
				}
			}
		});	
		/**删除最后一个部门角色时监听**/
		observer.on('DepInfodelete', function(data) {
			_this.role = "";
			$("#relate").attr("disabled",true);
		});
	};
	//打开coverlap， 进入关联部门步骤页面
	RoleDepTab.prototype._openAddCover = function() {
		var _this = this;
		var cov = new XyzCover({
			id: 'role_relate_cover',
			child: {
				path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/RoleDepRelate'),						
				options: {
					role_id: _this.role
				}
			}
		});
		cov.render();
	};
	module.exports = RoleDepTab;
});