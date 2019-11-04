define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        XyzAlert = require('xyz-alert'),
    ESYS = require('../../../public/common/ESYS'); 
    require('../../../public/lib/bootstrap-editable/js/bootstrap-editable.js')($);
    ESYS.require('datatable');
    require('xyz-jsonRPC')($);
    var PermissionControl = require('../../../public/permissioncontrol/PermissionControl');

    //模板引入
    var mainTpl = require('./template/SysParamMain.html');

    //服务地址
    var service = function() {
         var JSON_BASE = '/EPSERVICERUN/json/USAccess/json.do?service=',
            TABLE_BASE = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

        function getJsonURL(servUrl) {
            return JSON_BASE + servUrl;
        } 
        function getTableURL(servUrl) {
            return TABLE_BASE + servUrl;
        }
        return {
            QUEYR_SYSPARAM: getTableURL('epframe.epbos_systemParamService.querySysParamList'),
            UPDATE_SYSPARAM: getJsonURL('epframe.epbos_systemParamService.updateSysParamBycode')
        }
    }();
    var SystemParam = function(options) {
        this.initialize(options);
    };
   /**
    *  页面声明周期
    */
   SystemParam.prototype = {
        initialize: function(options) {
            this.el = options.el; 
        },
        render: function() {
            //登录用户是否有访问权限
            var permission = new PermissionControl({
                userGroup: ['1']
            });
            if(!permission.allow()){
                return false;    //无权限不允许继续访问
            }
            $(this.el).html(mainTpl);
            this.sysParamForm = $('#queryForm');
            this._bindEvent();
            this._renderSysParamTable();
        },
        dispose: function() {},
        refresh: function() {
            this.dispose();
            this.render()
        }
    };
    /**
     * 查询系统参数列表
     */
    SystemParam.prototype._renderSysParamTable = function() {
        var _this = this; 
        this.sysParamTable = new ESYS.datatable({
            el: '#sysParamTable',
            id: 'sysParamTable',
            url: service.QUEYR_SYSPARAM,
            checkbox: false,
            columns: [
            	{
                    field: 'param_name',
                    title: '参数名',
                    width: '190'
                },
                {
                    field: 'param_val',
                    title: '参数值',
                    tpl: '{this._renderEidtLink(item)}'
                },
                {
                    field: 'note',
                    title: '备注'
                } 
            ],
            events: {
            	datacallback: function() {
             		$('#sysParamTable .edit-link').editable({
                        title: '修改参数值', 
                        type: 'text',
                        send: 'always',
                        emptytext:"", 
                        validate: function(value){//参数值验证
                            var g = /^[0-9]*[0-9][0-9]*$/;
                            var param_type = $(this).attr("param_type");
                            var param_code =  $(this).attr("param_code");
                            if( value == "" ){ 
                                return "系统提示：参数不能为空！";
                            }
                            if(value.length>100){
                            return "系统提示：参数长度不可超过100";
                            }
                            if( param_type=="NUMERIC" && !g.test(value) ){ 
                                return "系统提示：参数只能数值！";
                            }
                        	 
                        	//设置日志数据保存的天数必须>=5
                     		if( param_code == "LOG_DATA_SAVE_DAYS" ){
                     			if( value<5 ){
                     				return "系统提示：日志数据保存的天数必须大于或等于5！";
                     			}
                     		}
                    		if( param_code == "MAX_TOP_NUM" ){
                    			if( value>5000 ){
                    				return "系统提示：查询结果记录最大数量不可超过5000条！"; 
                    			}else if( value<=0 ){
                    				return "系统提示：查询结果记录最大数量必须大于0！" 
                    			}
                    		}
                            //密码复杂度验证
                    	    if(  param_code == "STRENGTH_PWD" ){
                    		  
                                var gz = /^(([CUDNSLMRT]{1}:\d+);([CUDNSLMRT]{1}:\d+);([CUDNSLMRT]{1}:\d+);([CUDNSLMRT]{1}:\d+);([CUDNSLMRT]{1}:\d+);([CUDNSLMRT]{1}:\d+);([CUDNSLMRT]{1}:\d+);([CUDNSLMRT]{1}:\d+);([CUDNSLMRT]{1}:\d+))$/gi;//格式是否正确
                                var re =/^(?!.*(C|U|D|N|S|L|M|R|T).*\1)(C|U|D|N|S|L|M|R|T)+/gi;	//CUDNLS不重复--后向引用
                                if( !gz.test(value) || !re.test(value) ){
                                    return "系统提示：请填写正确的配置格式,参考密码复杂度参数说明";
                                    
                                }
                                var tmpval = value.split(";");
                                var total = 0;
                                var tmp = 0;
                                var total_c = 0;
                                var tmp_c = 0;
                                var rep_c = 0 ;//连续重复字符数
                                var rep_prvPwd_c = 0 ;//连续重复字符数
                                var rep_m_c = 0 ;//连续重复字符数
                                for(var i=0;tmpval!=null&&i<tmpval.length;i++){
                                    var single = tmpval[i].split(":");
                                    for (var j=0;single!=null && j<single.length;j++){
                                        if("C"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            tmp += parseInt(single[j+1]);
                                            total_c = parseInt(single[j+1]);
                                        }
                                        if("N"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            tmp += parseInt(single[j+1]);
                                        }
                                        if("S"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            tmp += parseInt(single[j+1]);
                                        }
                                        if("L"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            total = parseInt(single[j+1]);
                                        }
                                        if("U"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            tmp_c += parseInt(single[j+1]);
                                        }
                                        if("D"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            tmp_c += parseInt(single[j+1]);
                                        }
                                        if("M"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            rep_m_c = parseInt(single[j+1]);
                                        }
                                        if("R"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            rep_c = parseInt(single[j+1]);
                                        }
                                        if("T"==single[j].toUpperCase()&& "0"!=single[j+1]){
                                            rep_prvPwd_c = parseInt(single[j+1]);
                                        }
                                    }
                                }
                                if( rep_m_c  > 1 ){
                                    return "系统提示：用户代码不能作为密码的一部分(M)应配置0或1";
                                }
                                if ( rep_c ==  1 ) {
                                    return "系统提示：不允许出现连续相同字符(R)的配置应不能为 ：1"; 
                                }
                                if( rep_prvPwd_c ==  1){
                                    return "系统提示：不允许与前次密码连续相同字符(T)的配置不能为 ：1"; 
                                }
                                if(total_c!="0" && total_c<tmp_c){
                                    return "系统提示：字符数(C)的配置至少应为："+tmp_c;
                                }
                                if(total!="0"&&total<tmp){
                                    return "系统提示：长度(L)的配置至少应为："+tmp; 
                                }
                            }
                         },
                         url: function (params){//提交服务器 
                        	 var APP_ID = $(this).attr("app_id");
                             var PARAM_CODE = $(this).attr("param_code");
                             var ret ="";
                             var d = new $.Deferred(); 
                             //请求参数
                             var updateParam = {};
                             updateParam.app_id= APP_ID == "" ? 0 : APP_ID;
                             updateParam.param_code=PARAM_CODE;
                             updateParam.param_val= params.value;
                             var params = {
                                     params:updateParam
                             }; 
                             //jsonRPC请求服务
                            $.jsonRPC.request(service.UPDATE_SYSPARAM, { 
                                 params : params,
                                 async : false,
                                 success : function(response , url) {
                                	 d.resolve();
                                	 d.promise();
                                	 XyzAlert.success("保存成功！");
                                 },
                                 error : function(response , url) {  
                                    d.reject("保存错误！"); 
                                 }
                             }); 
                             return d;
                        /* return  $.ajax({
			                                 url     : url,
			                                 data    : updateParam,
			                                 type    : 'POST',
			                                 async   : false,
			                                 dataType: "json",
			                                 contentType: "application/json;charset=UTF-8",
			                                 processData: false,
			                                 headers: {
			                                     "Ex-h": exHeader 
			                                 }
                                          }); */
                        } /*,
                        success: function(response, newValue) {
                         	 alert(newValue);
                         	 return;
                         } */
            		}); 
            	 }
            }
        }, this);
        this.sysParamTable.render();
    };
    /**
     * 渲染链接标签
    */
    SystemParam.prototype._renderEidtLink = function(item){ 
        var html = "";
        if ( item.is_edit == "2" ){
    	   html = '<a class="edit-link" href="#" param_code="{item.param_code}" app_id="{item.app_id}"  param_type="{item.param_type}" >{item.param_val}</a>';
        } else  {
    	   html = '{item.param_val}';
        }
      return html;
    };
    /**
     * 绑定页面按钮事件
     */
    SystemParam.prototype._bindEvent = function() {
        var _this = this; 
        var timeoutId = null;
        function searchSysParam() { //查找筛选角色
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            var text = $(this).val();
            timeoutId = setTimeout(function() {
                _this.sysParamTable.setParams({
                    param_name: text
                });
                _this.sysParamTable.reload();
            }, 500);
        };
        $('#sysParam_search_input').bind('propertychange', searchSysParam)
        .bind('input', searchSysParam); 
    } 
    module.exports = SystemParam;
});