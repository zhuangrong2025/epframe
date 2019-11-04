define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        CryptoJS = require('crypto-js'),
        ESYS = require('../../public/common/ESYS'),
        Observer = require('observer'),
        Portal = require('../portlet/WPortlets');
    ESYS.require('dialog');
    var xyzIconFont = require('xyz-iconfont');
    //模板引入
    var mainTpl = require('./template/main.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        QUERY_ALL_PORTLETS: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.queryAllPortlets',
        GET_USER_PORTAL: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.queryUserPortalLayout',
        SAVE_USER_PORTAL: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.saveUserPortalLayout',
        GET_PORTAL_ICON_SETTING: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.queryUserPortalIconSetting',
        SAVE_PORTAL_ICON_SETTING: SERVICE_GATEWAY + 'epframe.epbos_portalManageService.saveUserPortalIconSetting'
    };

    var MyPortal = function (options) {
        this.initialize(options);
    };
    MyPortal.prototype = {
        initialize: function (options) {
            this.el = options.el;

        },
        render: function () {
            $(this.el).html(mainTpl);
            this.$settingIcon = $("#setting");
            this._loadPortalSetting();
            this.portal = new Portal({
                //el: this.el
                el: '.esys-portal-container'
            });
            this.portal.render();
            this._loadPortlets();
            this._bindEvent();
            var _this = this;
            window.reloadLayout = function() {
                this.reloadLayout.call(_this);//修改reloadLayout方法的作用域
            }

        },
        dispose: function () {
        },
        refresh: function () {
        }
    };
    /**
	 * 加载所有微应用的配置定义.
     * 微应用定义数据结构:
     *  [{
            portlet_code: 'BACKLOG',
            portlet_name: '待办任务',
            app_id: '2',
            app_name: '22',
            is_valid: 1,
            tools: 'setting',
            url: '/EPWEBRUN/epframe/release/portal/apps/backlog/app',
            cols: 3,
            height: 0,
            note: ''
        }, ...]
	 */
    MyPortal.prototype._loadPortlets = function() {
        var _this = this;
        $.jsonRPC.request(service.QUERY_ALL_PORTLETS, {
            params: {
                params: {}
            },
            success: function(response) {
                var list = response.data;
                _this.portlets = list;
                _this._loadLayout(); //加载个人应用布局
            }
        }); 
    },
    /**
     * 加载微应用布局配置并渲染   
     * 布局配置数据结构：
     *  {
            "portlet_layout": [{
                "portlet_code": 'BACKLOG',
                "cols": "3",
                "height": "250"
            },...] 
        }
     */
    MyPortal.prototype._loadLayout = function() {
        var _this = this;
        $.jsonRPC.request(service.GET_USER_PORTAL, {
            params: {
                params: {}
            },
            success: function(response) {
                var dataStr = response.data || {};
                if($.isEmptyObject(dataStr)){
                    return;
                }
                var data = JSON.parse(dataStr);
                _this.layoutPortlets = [];
                if(data && data.layout_config) {
                    var str = data.layout_config;   
                    /* //转码           
                    var words = CryptoJS.enc.Base64.parse(str);
                    var parseStr = str.toString(CryptoJS.enc.Utf8);
                    */
                    var layout = JSON.parse(str);
                    _this.layoutPortlets = layout.portlet_layout;
                    var items = _this._convert2PotletData(_this.layoutPortlets);
                    _this.portal.load(items);
                }
            }
        }); 
    },
    /**
     * 加载门户个人配置, 如入口图片显示等
     */
    MyPortal.prototype._loadPortalSetting = function() {
        var _this = this;
        this.poartalSetting = {//默认显示入口图标
            ICON_SETTING : '1'
        };
        $.jsonRPC.request(service.GET_PORTAL_ICON_SETTING, {
            params: {
                params: {}
            },
            success: function(response) {
                var showIcon = response.data === '0' ? '0' : '1';
                _.assign(_this.poartalSetting, {ICON_SETTING: showIcon});
                if(showIcon === '0') {
                    _this.$settingIcon.show();
                } else {
                    _this.$settingIcon.hide();
                }
            }
        });      
    },
    /**
     * 加载最新微应用数据重新布局.
     */
    MyPortal.prototype.reloadLayout = function() {
        this._loadLayout();
        this._loadPortalSetting();
    },
    /**
     * 应用配置定义的数据结构转为Portlet组件的数据格式.
     * Portlet的数据结构：
     *  {
            appKey : 'key1',
            title: '我的待办',
            cols: 6,
            resizable: true,
            height: '',
            tools: 'setting',
            url: '/EPWEBRUN/epframe/release/esystem/portal/app1'
        }
     */
    MyPortal.prototype._convert2PotletData = function(list) {
        var items = [];
        _.each(list, function(data) {
            if(!data){
                 return ;
            }
            var portletCode = data.portlet_code,
                index = _.findIndex(this.portlets, function(item) {
                    return item.portlet_code == portletCode
                }),
                portletData = index === -1 ? null : this.portlets[index];
            if(!portletData) return false;
            var item = _.assign({}, portletData, data);
            if(!item.cols) {//未配置cols属性，默认配置为3，占一半
                item.cols = portletData.cols || 3;
            }
            if(!_.isNumber(item.cols)) {
                item.cols = 3;
            }
            item.resizable = true;
            item.cols = item.cols > 6 ? 6 : item.cols;//可配置占用列最大为6
            items.push({
                appKey : item.portlet_code,
                title: item.portlet_name,
                url: item.url,
                height: item.height,
                resizable: item.resizable ? true : false, //该属性暂未开放定义
                tools: item.tools,
                cols: item.cols*2 //转为12等分
            })
        }, this);
        
        return items;
    }
    /**
     * 布局保存
     */
    MyPortal.prototype._save = function(data, refresh) {
        var _this = this;
        var layout = {
            portlet_layout: data
        };
        var portletLayouts ={
            layout_config : JSON.stringify(layout)
        }
        $.jsonRPC.request(service.SAVE_USER_PORTAL, {
            params: {
                params: {
                    layout: JSON.stringify(portletLayouts)
                }
            },
            success: function(response) {
                
            }
        });
    }
    // 事件绑定
    MyPortal.prototype._bindEvent = function() {
        var _this = this;
        //组件已更新，需刷新列表
        Observer.on('backlog:change', function() {
            _this._loadLayout();
            
        });
        this.portal.on('change', function(portal) {
            var portlets = portal.getData();
            var data = [];
            _.each(portlets, function(item) {
                data.push({
                    portlet_code: item.appKey,
                    cols: item.cols/2,
                    height: item.height
                });
            });
            _this._save(data);
        });
        // 首页配置
        this.$settingIcon.click("click", function() {
            
            var dialog = new ESYS.dialog({
                data: {
                    width: 720,
                    title: '首页配置',
                    url: ESYS.formaturl('/EPWEBRUN/epframe/release/portal/myportal/child/PortalSetting'),
                    options: {
                        portalSetting: this.poartalSetting,
                        portlets: _this.portlets || [],
                        layoutPortlets: _this.layoutPortlets || []
                    },
                    buttons: [
                        {type: 'cancel'},
                        {
                            type: 'save',
                            title: '确定',
                            handler: function(dlg) {
                                var inst = this.getInstance();
                                var cb = function() {
                                    _this.reloadLayout();//重新加载个人布局并渲染
                                    dlg.close();
                                }
                                inst.save && inst.save(cb);//保存
                            }
                        }
                    ]
                }
            }).render();
      })
    }
    module.exports = MyPortal;
});
