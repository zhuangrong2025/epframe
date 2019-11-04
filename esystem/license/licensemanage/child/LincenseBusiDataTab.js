define(function(require, exports, module) {
	var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        XyzTree = require('xyz-ztree'),
        ESYS = require('../../../../public/common/ESYS');
	    ESYS.require('datalist');
    
    //模板引入
    var tpl = require('./template/LincenseBusiDataTab.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=',
        TABLE_BASE = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

    var service = {
        GET_BUSI_DATA : SERVICE_GATEWAY + 'epframe.epbos_licenseService.getItemCodeDef',
        GET_BUSI_DATA_DETAIL : SERVICE_GATEWAY + 'epframe.epbos_licenseService.getBaseBusiInfo'
    };
    /**
     * 初始化页面
     */
	var LincenseBusiDataTab = function(options) {
		this.initialize(options);
	};
    /**
     * 页面生命周期
     */
	LincenseBusiDataTab.prototype = {
		initialize : function(options) {
            this.el = $(options.el); 
		},
		render : function() {
		   this.el.html(tpl); 
		   this._bindEvents();
		   Observer.trigger('busiDataTab:complete');
		},
		dispose : function() { 
            $(this.el).empty();
		},
		refresh : function() {
            this.dispose();
			this.render()
		}
    };
	/**
	 * 基础业务数据树
	 */
	LincenseBusiDataTab.prototype._loadBusiData = function() { 
		var _this = this;  
		if(this.busiDataList) {//重新请求数据
			this.busiDataList.reload();
		} else {//首次创建
			this.busiDataList = new ESYS.datalist({
				el: '#busi_data_tree_panle',
				data: { 
					url: service.GET_BUSI_DATA, //列表数据获取地址
					key: 'item_code',
					text: 'item_name',
					deletable:  false,
					search: false
				},
				events: { 
					click: function(data){ 
						_this.item_code = data.item_code ;
						var itemName = data.item_name +"明细数据";
						//$("#busi_data_detail_span").html ( itemName );
						_this._loadBusiDataDetail({item_val: data.item_code});
					} 
				}
			});
			//渲染树
			this.busiDataList.render(); 
		}
	};
	/**
	 * 相应基础业务数据明细
	 */
	LincenseBusiDataTab.prototype._loadBusiDataDetail = function(params) {
		var _this = this; 
		if(this.busiDataDetailList) {//重新请求数据
			this.busiDataDetailList.load(params);
		} else {//首次创建
			this.busiDataDetailList = new ESYS.datalist({
				el: '#busi_data_detail_panle',  
				data: {
					params : {
						item_val: _this.item_code
					},
					url: service.GET_BUSI_DATA_DETAIL, //列表数据获取地址
					key: 'item_code',
					text: 'item_name',
					deletable:  false,
					search: false,
					clickable: false//不可点击
				} 
			}); 
			//表格渲染
		  	this.busiDataDetailList.render();
		}
	};
    /**
     * 绑定事件
     */
	LincenseBusiDataTab.prototype._bindEvents = function() {
		var _this = this;	
	    //刷新TAB内的数据
		Observer.on('LincenseBusiDataTab:refresh', function(data){	 
	        _this._loadBusiData();
	    });
    }; 
	module.exports = LincenseBusiDataTab;
});