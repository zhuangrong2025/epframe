define(function(require, exports, module) {
	var _ = require('lodash'), 
        $ = require('jquery'),
        XyzZtree = require('xyz-ztree'),
        ESYS = require('../../../../../public/common/ESYS'),
        DepTree = require('/{WEB_NAME}/epframe/release/public/deptree/DepTree');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        SUIT_DEP_IDS: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryDepsByRoleId'
    };


	var SuitDepDlg = function(options) {
        this.initialize(options);
	};

	SuitDepDlg.prototype = {
		initialize : function(options) {
            this.el = $(options.el);
            this.role = options.role;
		},
		render : function() {
            var _this = this;
            this.el.html('<div class="suit_dep_tree_box" id="suitDepTree"></div>');
            this._getSuitDepData();
		},
		dispose : function() {
		},
		refresh : function() {
		}
    };

    SuitDepDlg.prototype._getSuitDepData = function(){
        var _this = this;
        $.jsonRPC.request(service.SUIT_DEP_IDS, {
            params: {
                params: {
                    role_id: _this.role.role_id
                }
            },
            success: function(response) {
                _this.suitDepIds = response.data;
                _this._renderSuitDepTree();
            }
        });
    }

    SuitDepDlg.prototype._renderSuitDepTree = function(){
        var _this = this;
        this.tree = new DepTree({
            el: '#suitDepTree',
            events: {
                dataCallback : function(tree) {
                    tree.expandAll(true);
                    $('#suitDepTree .node_name').addClass('esys-node-disabled');
                    //TODO 后续优化，暂时使用查找DOM的方式添加高度的选中效果
                    _.each(_this.suitDepIds, function(depId) {
                        var treeNode = tree.getNodeByParam('dep_id', depId);
                        $('#' + treeNode.tId).find('>[treenode_a]>.node_name').addClass('esys-node-enable');
                    });                    
                }
            }
        });
        this.tree.render();
    }

	module.exports = SuitDepDlg;
});