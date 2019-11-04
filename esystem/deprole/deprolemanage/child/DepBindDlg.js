define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        XyzAlert = require('xyz-alert'),
        ESYS = require('../../../../public/common/ESYS');
        ESYS.require('deptree');

    require('xyz-jsonRPC')($);    
    var tpl = require('./template/DepBindDlg.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=',
        TABLE_GATEWAY = '/EPSERVICERUN/json/USAccess/dataTables.do?service=';

    //服务网关地址
    var service = {
        SAVE_RELA : SERVICE_GATEWAY + 'epframe.epbos_deptRoleService.setDepRoleRela',
        GET_RELA_DEP: SERVICE_GATEWAY + 'epframe.epbos_deptRoleService.queryDepOfDepRole',//查询部门角色关联部门
    };


	var DepBindDlg = function(options) {
        this.initialize(options);
        this.role_id = options.role_id;
	};

	DepBindDlg.prototype = {
		initialize : function(options) {
            this.el = $(options.el);
            this.role = options.role;
            this.deps = []; //已选择的菜单数据
		},
		render : function() {
            this.el.html(tpl);
            this.CreateTree();           
		},
		dispose : function() {
            this.menus = [];
		},
		refresh : function() {
		}
    };
    DepBindDlg.prototype.CreateTree = function(){
        var _this = this;
        this.depTree = new ESYS.deptree({
            el: '#depBindTree',
            multiple: true,
            cascade: false,
            formatData: function(data) { // 格式化服务端返回的数据后，做树的初始化
				return data;
			},
            events: {
                dataCallback : function(m) {
                    //查询获取关联的部门  
                    _this._getRelaDep(m);
                                               
                }
            }
        });
        _this.depTree.render();
    }
    //勾选已关联部门
    DepBindDlg.prototype._getRelaDep = function(m) {
        var _this = this;
        $.jsonRPC.request(service.GET_RELA_DEP, {
            params: {
                params: {
                    role_id: _this.role.role_id
                }
            },
            success: function(response) {
                //在复选框中勾选
                var list = response.data;
                var deps = [];
                 for(index in list){
                    deps.push(list[index].dep_id);
                }
                m.setValue(deps);                
            },
            error: function(response) {
                XyzAlert.error('系统提示：获取关联部门失败！' + (response.desc ? '[' + response.desc + ']' : ''));                    
            }
        }); 
    }
    /*
     * 保存数据, dialog组件会调用该方法. 
     * cb为回调函数，保存成功后调用cb关闭对话框.
     */
    DepBindDlg.prototype.save = function(cb) {
        var deps = this.depTree.getValue();
        $.jsonRPC.request(service.SAVE_RELA, {
            params: {
                params: {
                    role_id: this.role.role_id,
                    dep_ids: deps
                }
            },
            success: function(response) {
                cb && cb();
            }
        });
    }


	module.exports = DepBindDlg;
});