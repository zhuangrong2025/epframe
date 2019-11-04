define(function(require, exports, module) {
    var _ = require('lodash'),
        $ = require('jquery'),
        Observer = require('observer'),
        XyzTree = require('xyz-ztree');
        require('xyz-jsonRPC')($);
        ESYS = require('../../../../public/common/ESYS');
        ESYS.require('datalist');
    
    //模板引入
    var tpl = require('./template/LicenseFuncInfoTab.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        GET_APP_INFO: SERVICE_GATEWAY + 'epframe.epbos_licenseService.getAppInfo',
        GET_LICENSE_PROPERTY: SERVICE_GATEWAY + 'epframe.epbos_licenseService.getLicenseProperty',
        GET_FUNCTION_INFO: SERVICE_GATEWAY + 'epframe.epbos_licenseService.getFunction'
    };
    /**
     * 初始化页面
     */
    var LicenseFuncInfoTab = function(options) {
        this.initialize(options);
    };
    /**
     * 页面生命周期
     */
    LicenseFuncInfoTab.prototype = {
        initialize: function(options) {
            this.el = $(options.el); 
        },
        render: function() {
            this.el.html(tpl); 
            this._bindEvent();
            Observer.trigger('baseInfoTab:complete');//加载完成
        },
        dispose: function() {
            this.el.empty();
        },
        refresh: function() {
            this.dispose();
            this.render()
        }
    };
    /**
     * 初始化表单
     */
    LicenseFuncInfoTab.prototype._loadLicenseInfo = function(){
    	var _this = this;
    	$.jsonRPC.request({
            url: service.GET_LICENSE_PROPERTY, 
            success: function(response) {//回填数据到表格
                _this.data = response.data;
                $.each( _this.data ,function(index,value){
                   // console.log(value);
                    var inputId = "#"+value.item_code;
                    if ( $(inputId) != null  ){
                        $(inputId).val(value.item_value) ;
                    }  
                });
            }
        });
    }
    /**
     * 初始化系统列表
     */
    LicenseFuncInfoTab.prototype._loadAppList = function() {  
        if(this.appInfoList) {//重新请求数据
            this.appInfoList.reload();
        } else {//首次创建
            this.appInfoList = new ESYS.datalist({
                el: '#app_info_tree_panle',
                data: { 
                    title: '',
                    url: service.GET_APP_INFO, //列表数据获取地址
                    key: 'app_id',
                    text: 'app_name',
                    deletable:  false,
                    search: false,
                    clickable: false,//不可点击
                }
            });
            //渲染树
            this.appInfoList.render();
        }
    }
    /**
     * 初始化功能点树
     */
    LicenseFuncInfoTab.prototype._loadFunctionList = function () {
   	    if(this.functionTree) {//重新请求数据
            this.functionTree.refresh()
        } else {//首次创建
            this.functionTree = new XyzTree({
                el: '#func_info_tree_panle',  
                ajax: {
                    url: service.GET_FUNCTION_INFO,
                    id: 'func_code',
                    pid: 'parent_func_code',
                    text: 'func_name'
                },
                formatData: function(data) {
                   $.each(data, function(i, n) {
                       n.open = true;  
                   });
                   return data;
                }
            }); 
            //渲染树
            this.functionTree.render();
        }
    }
    /**
     * 绑定事件
     */
    LicenseFuncInfoTab.prototype._bindEvent = function() {
        var _this = this;	
        //刷新TAB内的数据
	    Observer.on('LicenseFuncInfoTab:refresh', function(data){	
		    _this._loadLicenseInfo();
            _this._loadAppList();
            _this._loadFunctionList();
        });
    }; 
    module.exports = LicenseFuncInfoTab;
});