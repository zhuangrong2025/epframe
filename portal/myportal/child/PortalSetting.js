define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        XyzBootstrapSwitch = require('xyz-bootstrap-switch');
    require('../MyPortal.css');

    //模板引入
    var mainTpl = require('./template/PortalSetting.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        SAVE_USER_PORTAL: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.saveUserPortalLayout',
        SAVE_PORTAL_ICON_SETTING: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.saveUserPortalIconSetting',
        QUERY_ALL_PORTLETS: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.queryAllPortlets',
        GET_USER_PORTAL: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.queryUserPortalLayout',
        GET_PORTAL_ICON_SETTING: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.queryUserPortalIconSetting'
    };


    var PortalSetting = function (options) {
        this.initialize(options);
    };
    PortalSetting.prototype = {
        initialize: function (options) {
            this.el = $(options.el);
            this.portlets = options.portlets;
            this.layoutPortlets = options.layoutPortlets;
            this.portalSetting = options.portalSetting;
            this.portletCodes = [];//当前的个人首页组件代码缓存
            this._beforeRender();
        },
        render: function () {
            $(this.el).html(mainTpl);
            this._entranceSet();
            this._loadComponents();
        },
        dispose: function () {
        },
        refresh: function () {
        }
    };
    PortalSetting.prototype._beforeRender = function() {
        if($.isEmptyObject(this.portlets)){
            this._loadPortlets();
        }
        if($.isEmptyObject(this.layoutPortlets)){
            this._layoutPortlets();
        }
        if($.isEmptyObject(this.portalSetting)){
            this._loadPortalSetting();
        }
    }
    PortalSetting.prototype._loadPortlets = function() {
        var _this = this;
        $.jsonRPC.request(service.QUERY_ALL_PORTLETS, {
            params: {
                params: {}
            },
            success: function(response) {
                var list = response.data;
                _this.portlets = list;
            },
            error : function(e){
                console.log(e);
            }
        });
    };
    PortalSetting.prototype._layoutPortlets = function() {
        var _this = this;
        $.jsonRPC.request(service.GET_USER_PORTAL, {
            params: {
                params: {}
            },
            success: function(response) {
                var dataStr = response.data || {};
                var data = JSON.parse(dataStr);
                _this.layoutPortlets = [];
                if(data && data.layout_config) {
                    var str = data.layout_config;   
                    var layout = JSON.parse(str);
                    _this.layoutPortlets = layout.portlet_layout;
                }
            }
        });
    };
    PortalSetting.prototype._loadPortalSetting = function() {
        var _this = this;
        this.poartalSetting = {//默认显示入口图标
            ICON_SETTING : '1'
        };
        $.jsonRPC.request(service.GET_PORTAL_ICON_SETTING, {
            params: {
                params: {}
            },
            success: function(response) {               
                _.assign(_this.poartalSetting, {ICON_SETTING: response.data === '0' ? '0' : '1'});
            }
        });      
    };
    //渲染所有组件列表
    PortalSetting.prototype._loadComponents = function() {
        var _this = this;   
        this.layoutPortlets && this.layoutPortlets.length>0 && _.forEach(this.layoutPortlets,function(item){
            item  &&  _this.portletCodes.push(item.portlet_code);
        });
        var content ="";
        content += "<div class='app-list-box'>";
        if (this.portlets) {
            _.forEach(_this.portlets,function(item) {
                content +=     "<div class='form_checkbox app-item'>";
                content +=         "<label class='mt-checkbox mt-checkbox-single mt-checkbox-outline'>";
                if($.inArray(item.portlet_code,_this.portletCodes)>-1){
                    content +=             "<input type='checkbox' class='checkboxes' checked seleted value='"+item.portlet_code+"'>"+item.portlet_name+"（"+item.app_name+"）<i data-code='y'></i><span></span>";
                }else{
                    content +=             "<input type='checkbox' class='checkboxes'  value='"+item.portlet_code+"'>"+item.portlet_name+"（"+item.app_name+"）<i data-code='y'></i><span></span>";
                }                
                content +=         "</label>";
                content +=     "</div>";
            });
        }
        content +=     "<div class='clearfix'></div>"
        content += "</div>"
        this.el.find(".app-list-set .appSetting-group-content").html(content);
    },
    //配置入口图标隐藏开关的动态显示
    PortalSetting.prototype._entranceSet = function() {
        var _this = this;
            state = _this.poartalSetting && _this.poartalSetting.ICON_SETTING == "1" ? true: false;
        _this.switchON = new XyzBootstrapSwitch({
            el: "#entrance",
            name: 'entrance',
            state: state, 
            events: {}
        })
        
        _this.switchON.render();
    },
    //保存设置
    PortalSetting.prototype.save = function(cb) {
        this._getUserCurLayout();
        this._saveConfig(cb);
    },
    PortalSetting.prototype._saveConfig = function(cb) {
        this._saveIconSetting(cb);
    }
    //保存图标设置
    PortalSetting.prototype._saveIconSetting = function(cb) {
        var _this = this;
        var ICON_SETTING = this.switchON.getValue()=== false ? '0' : '1';
        $.jsonRPC.request(service.SAVE_PORTAL_ICON_SETTING, {
            params: {
                params: {
                    icon_setting: ICON_SETTING
                }
            },
            success: function(response) {
              // console.log("保存首页入口图标配置成功！！！");
               _this._saveUserPortal(cb);
            },
            error:function(error){
                console.log(error);
            }
        });
    },
    //保存用户布局设置
    PortalSetting.prototype._saveUserPortal = function(cb) {
        var portletLayouts = {},p = {};
        p.portlet_layout = this.layoutPortlets ;
        var pStr = JSON.stringify(p);
        portletLayouts.layout_config = pStr;    
        $.jsonRPC.request(service.SAVE_USER_PORTAL, {
            params: {
                params: {
                    layout: JSON.stringify(portletLayouts)
                }
            },
            success: function(response) {
                //console.log("保存用户首页应用布局成功！！！");
                //此处应该通知刷新布局页面
                cb();
                Observer.trigger('backlog:change');
            },
            error:function(error){
                console.log(error);
            }
        });
    },
    //获取用户最新布局
    PortalSetting.prototype._getUserCurLayout = function() {
        var _this = this;
        var appItems = this.el.find(".app-list-set .appSetting-group-content .app-list-box .app-item input[type=checkbox]:checked");
        var curCodes = [];
        appItems.each(function() {
            curCodes.push($(this).val());
        });
         //添加新增配置
        if (curCodes) {
            _.forEach(curCodes,function(code) {
                if($.inArray(code,_this.portletCodes) == -1){
                    _.forEach(_this.portlets,function(item) {
                        if(item.portlet_code == code){
                            var addPortlet = {};
                            addPortlet.portlet_code = item.portlet_code;
                            addPortlet.cols = ""+item.cols;
                            addPortlet.height = ""+item.height;
                            _this.layoutPortlets.push(addPortlet);
                            return;                    
                        }          
                    });
                }              
             });
         }
         //删除配置
        if (this.portletCodes) {
            _.forEach(_this.portletCodes,function(code) {
                if($.inArray(code,curCodes) == -1){
                    var removeIndex = -1;
                    $.each(_this.layoutPortlets,function(index,item){
                        if(item && item.portlet_code == code ){
                            removeIndex = index;
                            return;
                        }          
                    });
                    removeIndex != -1 && _this.layoutPortlets.splice(removeIndex,1);
                }                          
            });
        }
    }
    module.exports = PortalSetting;
});
