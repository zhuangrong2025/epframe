define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        XyzAlert = require('xyz-alert'),
        xyzCry = require('xyz-cryptojs'),
        xyzUtil = require('xyz-util'),
        ESYS = require('../../../public/common/ESYS');
    require('jquery-file-upload')($);
    ESYS.require('tab');
    var PermissionControl = require('../../../public/permissioncontrol/PermissionControl');

    //模板引入
    var mainTpl = require('./template/LicenseManageMain.html');

    //服务地址
    var service = function() {
        var JSON_BASE =  '/EPSERVICERUN/json/USAccess/json.do?service=',
            FILE_BASE = '/EPSERVICERUN/file/USAccess/uploadFile.do?service=',
            TABLE_BASE = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

        function getFileURL(servUrl) {
            return ESYS.formatServiceUrl(FILE_BASE + servUrl);
        } 
        function getTableURL(servUrl) {
            return TABLE_BASE + servUrl;
        }
        function getJsonURL(servUrl) {
            return JSON_BASE + servUrl;
        }
        return {
        	QUEYR_APP_INFO: getTableURL('epframe.epbos_licenseService.getAppInfo'),
        	QUERY_FUNCTION: getTableURL('epframe.epbos_licenseService.getFunction'), 
            READ_LICENSE_FILE: getFileURL('epframe.epbos_licenseService.readLicenseInfoFromFile'),
            READ_88888_LICENSE: getJsonURL('epframe.epbos_licenseService.readLicenseInfo'),
            UPDATE_LICENSE_FILE: getJsonURL('epframe.epbos_licenseService.updateLicenseInfo')
        }
    }();
    /**
     * 初始化页面
     */
    var LicenseManage = function(options) {
        this.initialize(options);
    };
   /**
    *  页面生命周期
    */
    LicenseManage.prototype = {
        initialize: function(options) {
            this.el = options.el;  
        },
        render: function() {//登录用户是否有访问权限
            var permission = new PermissionControl({
                userGroup: ['1']
            });
            if(!permission.allow()){
                return false;    //无权限不允许继续访问
            }
            $(this.el).html(mainTpl); 
            this._createLicenseContentTab();
            this._hideMask();
            this._licenseFileUpload();//执行调用$("#license_file").fileupload的绑定，防止在IE11下，点击事件无法上传
            this._bindEvent(); 
        },
        dispose: function() {},
        refresh: function() {
            this.dispose();
            this.render()
        }
    };
   /**
    * Tab页面初始化
    */
    LicenseManage.prototype._createLicenseContentTab = function (){
        var _this = this;
		// 切换tab
		this.tabTag = new ESYS.tab({
			el : '#licenseContent',
			view: 'line',
			config : [{
				id : 'LicenseFuncInfoTab',
				title : '基本信息和功能',
				child : {
					path : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/license/licensemanage/child/LicenseFuncInfoTab')
				}
			}, {
				id : 'LincenseBusiDataTab',
				title : '基础业务数据',
				child : {
					path : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/license/licensemanage/child/LincenseBusiDataTab')
				}
			}]
		});
		this.tabTag.render();
    };
    LicenseManage.prototype._showMask =  function (){ 
        $("#mask").show();     
    }  
    LicenseManage.prototype._hideMask =  function (){     
    	$("#mask").hide();  
    } 
    /**
     * 加入exHeader
     */
    LicenseManage.prototype._getExheader = function(tm) {
        var result = xyzCry.encryptByCsrf(tm);
        return result;
    };
    LicenseManage.prototype._getPermissionAuth = function() {
        var menuCode = '999999999';
        var funcCode = '999999999';
        var controlCode = '';
        var baseCom = window.ModulesGlobal && window.ModulesGlobal.BaseCommonModule;
        if(baseCom){
            var actMenu = baseCom.getActiveMenu();
            if(actMenu){
                menuCode = actMenu.menu_code;
                funcCode = actMenu.func_code;
            }
        }
        var stringAppend = menuCode + ',' + funcCode + ',' + controlCode;
        return xyzCry.encryptByDESModeCBC(stringAppend);
    };
    /**
     * 上传许可文件
     */
    LicenseManage.prototype._licenseFileUpload = function () { 
	   	var _this = this,
	   	    tm = xyzCry.getTm(),
            exHeader = this._getExheader(tm),
            permisAuth = this._getPermissionAuth();
        //定义系统请求的url
        var url = xyzUtil.joinUrlParams(service.READ_LICENSE_FILE, {
            tm: tm
        });
	   	$("#license_file").fileupload({
	   		 url: url,
	   		 dataType: "json",  
	   		beforeSend: function(xhr, data) {
	   	        xhr.setRequestHeader("Ex-h", exHeader);
	   	        xhr.setRequestHeader("Ex-Service-Uri", "");
	   	        xhr.setRequestHeader('PermissionAuthen', permisAuth);
	   	        //xhr.setRequestHeader(MENU_CODE, exHeader);
	   	    } ,
	   		add: function(e, data){  
	   		    var acceptFileTypes = /^lic$/i;  
	   	        var files = data.originalFiles;
	   	        //上传单个文件
	   	        var name = files[0]["name"];  
                var lastIndex = name.lastIndexOf(".");  
	   	        var fileType = name.substring(lastIndex + 1);  
	   	        //验证上传的文件类型 [lic]
	   	        if(!acceptFileTypes.test(fileType)){ 
	   	        	XyzAlert.error("您导入的文件非许可证文件类型");
	                return;  
	            } 
	   	        $('#license_file_show').val(name);
	   	        //提交数据
	   	        data.submit();  
	   	        //打开遮罩
	   	        _this._showMask();
	   		},
	   		progressall: function(e, data){//上传进度
	   			var progressIng = parseInt(data.loaded / data.total * 100,10); 
	   			//window.console && console.log(progressIng);
	   		},
	   	    done: function(e, data){//上传完成 
	   	    	if (data.result.result.retCode == "-1") {
	   	    		XyzAlert.error("系统提示："+data.result.result.message);
	   	    	} else {
                    Observer.trigger('LicenseFuncInfoTab:refresh');
                    Observer.trigger('LincenseBusiDataTab:refresh');
	   	    		XyzAlert.success("许可证读取成功, 请确认后导入");
	   	    	}
	   	       //关闭遮罩
	   	    	_this._hideMask();
	   	    	//导入、查看当前许可 按钮设置可用状态
	   	    	$("#import_license").removeAttr("disabled"); 
	   		}
	   	});

    };
   /**
    * 导入
    */
    LicenseManage.prototype._updateLicenseFile = function() {  
    	$.jsonRPC.request(service.UPDATE_LICENSE_FILE, { 
            success: function(response) {
                XyzAlert.success('系统提示：导入成功！'); 
            },
            error: function(response) {
                XyzAlert.error('系统提示：导入失败！' + (response.message ? '[' + response.message + ']' : ''));
            }
        });
    }
    /**
     * 解析LICENSE（88888）的许可数据
     */
    LicenseManage.prototype._readLicenseInfo = function(callback) {  
    	$.jsonRPC.request(service.READ_88888_LICENSE, { 
            success: function(response) {
                if(response.data) {//存在正式许可
                    //刷新TAB页数据
                    Observer.trigger('LicenseFuncInfoTab:refresh');
                    Observer.trigger('LincenseBusiDataTab:refresh'); 
                    callback && callback();
                } else {
                    $('#read_license').attr('disabled', ''); //禁用读取按扭
                }
            },
            error: function(response) {
                XyzAlert.error('系统提示：读取失败！' + (response.message ? '[' + response.message + ']' : ''));
            }
        });
    }
    /**
     * 绑定页面按钮事件
     */
    LicenseManage.prototype._bindEvent = function() {  
    	var  _this = this;  
    	$('#read_license').on('click',function() {
          	_this._readLicenseInfo(function() {
                XyzAlert.success('系统提示：读取成功！'); 
            });
        });
    	$('#import_license').on('click',function() { 
         	_this._updateLicenseFile();
        });
        $('i.xy-icon').on('click',function() {
        	 $("#license_file").click();
        	_this._licenseFileUpload();
        });
        Observer.on('baseInfoTab:complete', function() {//基础信息TAB加载完成，读取许可证信息
            _this._readLicenseInfo();
        });
        Observer.on('busiDataTab:complete', function() {//业务数据TAB加载完成，开始加载数据
            Observer.trigger('LincenseBusiDataTab:refresh');
        });
    } 
    module.exports = LicenseManage;
});