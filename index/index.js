define(function(require, exports, module) {
    var $ = require('jquery'),
        baseCommon = require('base-common-module'),
        _ = require('lodash'),
        observer = require('observer'),
        storage = require('xyz-storage'),
        xyzAlert = require('xyz-alert'),
        IndexMenu = require('./IndexMenu'),
        IndexScene = require('./IndexScene'),
        IndexHistory = require('./IndexHistory'),
        IndexToolBar = require('./IndexToolBar'),
        IndexFavorite = require('./IndexFavorite'),
        IndexApplication = require('./IndexApplication'),
        IndexShadow = require('./IndexShadow'),
        ESYS = require('../public/common/ESYS');

    require('xyz-iconfont');
    require('font-Awesome');
    require('xyz-jsonRPC')($);

    //扩展方法：防止原有data方法自动类型转换
    $.fn.dataString || ($.fn.dataString = function(dataKey) {
        return '' + $(this).data(dataKey);
    });

    var maxReg = /.*?(?:\?|&)maximize=1(&)*/g; //菜单最大化参数正则表达式
    //模板引入
    var mainTpl = require('./template/IndexMain.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        LOGON_INFO: SERVICE_GATEWAY + 'epframe.epbos_userSupportService.getUserContext',
        APP_LIST: SERVICE_GATEWAY + 'epframe.epbos_userSupportService.getAppInfoList',
        USER_RIGHT: SERVICE_GATEWAY + 'epframe.epbos_userSupportService.getUserRightByAppId',
        USER_INFO: SERVICE_GATEWAY + 'epframe.epbos_userManageService.getMyUserInfo',
        CHECK_LICENSE: SERVICE_GATEWAY + 'epframe.epbos_licenseService.checkLicense',
        CHECK_LOGIN:SERVICE_GATEWAY + 'epframe.epbos_userSupportService.checkLogin'
    };

    function Index(options) {
        this.initialize(options);
    };

    Index.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            this.jdom = {};
            this._CACHE = {};
            this.appId;
            this.adminNotImportLicense = null;
        },
        render: function() {
            this.el.html(mainTpl);
            this._beforeInit();
        }
    };

    Index.prototype._beforeInit = function() {
        var _this = this;
        this._doCheckLogin();
        this._doCheckLicense(function(result) {
            if (result) {
                _this._init();
            }
        });
    };

    //初始化
    Index.prototype._init = function() {
        var _this = this,
            jdom = this.jdom;

        this._getAppList(); //初始系统列表
        if (this._doLogout === true) { //超时登出
            return;
        }
        var allowVisit = true; //默认允许访问
        var isDefaultApp = true; //是否为默认的系统
        this.allowSwitch = true; //默认允许切换系统
        if (!this.appList || !this.appList.length) { //无权访问系统，不继续处理
            allowVisit = false;
        } else {
            var switchAppId = _this._getAppIdParam();
            if (switchAppId !== null) {
                var _index = _.findIndex(this.appList, function(app) {
                    return app.app_id == switchAppId;
                });
                allowVisit = _index === -1 ? false : true;
                this.curAppId = parseInt(switchAppId); //传入的app_id作为当前APP_ID
                this.allowSwitch = false; //禁止切换系统
                isDefaultApp = false; //非默认系统，是通过切换方式过来的子系统
            }
        }
        if (!allowVisit) {
            xyzAlert.warning('无权访问系统', {
                closeOnConfirm: false,
                confirmButtonText: '确定',
                confirm: function() {
                    _this._logout();
                }
            });
            return;
        }
        if (!this.curAppId) {
            this.curAppId = this.appList[0].app_id; //获取当前系统列表
        }
		//this.appList.push({app_name: "EFrame系统", is_valid: "1", app_path: "EFrameWeb", app_id: 1100});
        if (this.appList.length === 1) { //仅一个子系统可访问，不允许切换
            this.allowSwitch = false;
        }
		this._CACHE.APP_CACHE = {};
		var url = window.location.href,
			path = window.location.pathname,
			webApp = path.split('/')[1];
		_.each(this.appList, function(app) {
			var app_id = app.app_id,
				app_url = app.app_url || '',
				app_path = app.app_path || 'EPWEBRUN',
				app_type = app.app_type || '0';
			this._CACHE.APP_CACHE[app_id] = _.assign({}, {
				app_id : app_id + '',
				app_url : app_url,
				app_path : app_path,
				app_type : app_type,
				name : name,
				app_curr: app_id == this.curAppId ? true : false //是否为当前系统
			});
		}, this);
		
        //create indexMenu
        this.indexMenu = new IndexMenu({
            el_header: '#headerMenu',
            el_broadside: '#broadsideMenu',
            events: {
                changeMenu: function(menuCode) {
                    var menuInfo = _this._CACHE.MENU.hashMap[menuCode];
                    if (menuInfo && menuInfo.func_path && maxReg.test(menuInfo.func_path)) {
                        _this._collapseSideMenu(); //最大化页面
                    }
                    _this.indexScene.openMenuTab(menuCode, { fromMenu: true });
                },
                clickTopMenu: function(menuCode) {
                    var favIcon = jdom.header_tool.find('.favorite a i')
                    favIcon.trigger('click');
                    if (_this.jdom.index.hasClass('index_collapse')) {
                        _this.jdom.header_logo.find('div.submenu_toggler').trigger('click');
                    }
                }
            }
        });

        //create indexToolBar
        this.indexToolBar = new IndexToolBar({
            el: '#headerToolbar',
            main: this, //首页主模块
            isContainer: isDefaultApp,
            events: {
                openCustomedTab: function(tabCode, tabName, tabUrl) {
                    _this.indexScene.openCustomedTab(tabCode, tabName, tabUrl);
                },
                openMenuTab: function(menuCode) {
                    _this.indexScene.openMenuTab(menuCode);
                },
                changeTheme: function(theme) {
                    storage.setSessItem('global_theme', theme);
                    _this.indexScene.changeTheme(theme);
                }
            }
        }).render();

        // 打开收藏夹
        this.indexFavorite = new IndexFavorite({
            main: this,
            events: {
                openMenuTab : function(menuCode) {
                    _this.indexScene.openMenuTab(menuCode);
                }
            }
        });
        this.indexFavorite.render();

        //create indexScene
        this.indexScene = new IndexScene({
            el: '#scene',
            main: this,
            events: {
                changeScene: function(code, menu, options) {
                    var custMap = _this.indexScene.getCustData();
                    if(custMap[code]) {//自定义菜单
                        if(maxReg.test(custMap[code].url)) {//最大化
                            _this._collapseSideMenu(); //最大化页面
                        }
                    }
                    _this._configActiveMenu(menu);
                    _this.indexMenu.setActiveCode(code, (null === options || true !== options.fromMenu) ? true : false);
                }
            }
        }).render();
		this.indexScene.setAppData(this._CACHE.APP_CACHE);
		
        //create indexHistory
        this.indexHistory = new IndexHistory({
            events: {
                openMenu: function(menuCode) {
                    _this.indexScene.openMenuTab(menuCode);
                }
            }
        }).render();


        //create indexApplication
        this.indexApplication = new IndexApplication({
            //el: '#headerApplication',
            el: '#index_wrapper .index_header',
            app: {
                list: this.appList,
                cur_app_id: this.curAppId,
                allowSwitch: this.allowSwitch
            },
            events: {
                /* 原有切换逻辑
                 changeApplication : function(appId) {
                     _this.curAppId = appId;
                     _this._loadAppMenus(appId);
                     _this.indexScene.refresh();
                     _this._getLoginInfo(function(loginInfo) {
                         storage.setSessItem('login', loginInfo);
                         _this._CACHE.USER = loginInfo;
                     });
                 }, */
                openSwitch: function() {
                    _this.indexScene.setTabsStop(); //暂停子页面的运行
                },
                closeSwitch: function() {
                    _this._getLoginInfo(function(loginInfo) {
                        storage.setSessItem('login', loginInfo);
                        _this._CACHE.USER = loginInfo;
                        _this.indexScene.setTabsRun(); //恢复子页面的运行
                    });
                    baseCommon.setActiveMenu(_this._getLocalData('activeMenu'));
                }
            }
        }).render();

        //create indexShadow
        this.indexShadow = new IndexShadow();

        //global jquery element reference
        jdom.index = $('#index_wrapper');
        //header zone
        jdom.header = jdom.index.find('>div.index_header');
        jdom.header_logo = jdom.header.find('>div.index_header_logo');
        jdom.header_menu = jdom.header.find('>div.index_header_menu');
        jdom.header_tool = jdom.header.find('>div.index_header_tool');
        //container zone
        jdom.container = jdom.index.find('>div.index_container');
        //broadside zone
        jdom.broadside_wrapper = jdom.container.find('>div.index_broadside_wrapper');
        //content zone
        jdom.content_wrapper = jdom.container.find('>div.index_content_wrapper');
        jdom.content_tabs = jdom.content_wrapper.find('>div.content_tabs');

        setTimeout(function() {
            _this._getLoginInfo(function(loginInfo) {
                var isUpdPWD = loginInfo.user.is_update_pwd;
                if (isUpdPWD == '1') {
                    window.location.href = ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/modifypwd/ModifyPwd.html');
                }
                storage.setSessItem('login', loginInfo);
                _this._saveLocalData('loginInfo', loginInfo); //保存当前用户上下文信息
                _this._CACHE.USER = loginInfo;
                //_this.appId = loginInfo.context.app_id; //暂时无用，此处为产品ID.
                _this.indexToolBar.setUserData(_this._CACHE.USER);
                isDefaultApp && _this.indexApplication.setUserData(_this._CACHE.USER);
                _this._adjustPanelSize(true);
                _this._loadAppMenus(this.curAppId, isDefaultApp, function() {
                    if (window.top === window) {
                        observer.trigger('index:loadMessageContext');
                    }
                });
            });
        }, 0);

        this._bindEvent();
    };

    //加载子系统菜单
    Index.prototype._loadAppMenus = function(appId, isDefaultApp, callback) {
        var _this = this;
        this._getUserRight(appId || this.curAppId, function(userRight) {
            _this._processMenuData(userRight);
            observer.trigger('loadMenu', _this._CACHE.MENU); //菜单加载完事件
            _this.indexMenu.setMenuData(_this._CACHE.MENU, true);
            _this.indexScene.setMenuData(_this._CACHE.MENU);
            _this.indexHistory.setHistoricMenuKey('index_HISTORIC_MENU_' + _this.curAppId + '_' + _this._CACHE.USER.user_code);
            _this.indexHistory.setMenuData(_this._CACHE.MENU);
            if(isDefaultApp) {
                if(_this.adminNotImportLicense){
                    var menuInfo = _this._CACHE.MENU.hashMap[10010204];
                    _this._configActiveMenu(menuInfo);
                }else{
                    _this._configActiveMenu(null);
                }  
                _this.indexScene.openCustomedTab('@$MyPortal', '  首页  ', ESYS.formaturl('/EPWEBRUN/epframe/release/portal/index.html'), false);
            }
            setTimeout(function() {
                _this.indexHistory.openLastHistoricMenu();
            }, 300);
            $.isFunction(callback) && callback();
        });
    }

    //调整面板（logo/tool/menu区域自适应）
    Index.prototype._adjustPanelSize = function(isFirst) {
        var _this = this,
            totalWidth = this.jdom.header.width(),
            totalHeight = $(window).height(),
            headerHeight = this.jdom.header.height(),
            logoWidth = this.jdom.header_logo.width(),
            toolWidth = this.jdom.header_tool.width();
        this.jdom.header.css('min-width', logoWidth + toolWidth + 'px');
        this.jdom.header_menu.css({
            left: logoWidth + 'px',
            width: totalWidth - logoWidth - toolWidth - 20 + 'px'
        });
        var height = totalHeight - headerHeight;
        this.jdom.container.css('height', height > 0 ? height + 'px' : 0);
        if (isFirst) {
            this.jdom.header.animate({ top: 0 }, 300);
            this.jdom.content_tabs.animate({ top: 0 }, 300);
            this.jdom.broadside_wrapper.animate({ left: 0 }, 300);
        }
        //延迟执行
        if (this._CACHE.tabAdjustTimer) {
            clearTimeout(_this._CACHE.tabAdjustTimer);
        }
        this._CACHE.tabAdjustTimer = setTimeout(function() {
            _this._CACHE.tabAdjustTimer = null;
            _this.indexMenu && _this.indexMenu.locateMemuPostion();
            _this.indexScene && _this.indexScene.locateTabPosition();
        }, 350);
    };

    //获取登录用户可访问系统列表信息
    Index.prototype._getAppList = function() {
        var _this = this;
        $.jsonRPC.request(service.APP_LIST, {
            async: false, //同步获取数据
            params: {
                params: {}
            },
            success: function(response) {
                var data = response.data;
                /* if(!data.length) {
                    xyzAlert.warning('无权访问系统', {
                        closeOnConfirm: false,
                        confirmButtonText: '确定',
                        confirm: function() {
                            _this._logout();
                        }
                    });
                } */
                _this.appList = response.data;
            },
            error: function(response) {
                if (response && response.retCode === 999000) { //暂时写死，后续考虑
                    _this._doLogout = true;
                    _this._logout();
                } else {
                    xyzAlert.error('页面加载出错，请重新访问该页面!');
                    window.console && console.log('获取登录信息出错', response);
                }
            }
        });
    };
    Index.prototype._getAppIdParam = function() {
        var reg = new RegExp("(^|\\?|&)app_id=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg); //search,查询?后面的参数，并匹配正则
        if (r != null) return unescape(r[2]);
        return null;
    }

    Index.prototype._logout = function() {
    	IndexToolBar.logout();
    }

    //获取登录用户信息
    Index.prototype._getLoginInfo = function(callback) {
        var _this = this;
        $.jsonRPC.request(service.LOGON_INFO, {
            params: {
                params: { app_id: _this.curAppId }
            },
            success: function(response) {
                var data = response.data;
                if ($.isFunction(callback)) {
                    callback.call(_this, data);
                }
            },
            error: function(response) {
                xyzAlert.error('页面加载出错，请重新访问该页面!');
                window.console && console.log('获取登录信息出错', response);
            }
        });
    };
    Index.prototype._doCheckLogin = function() {
        $.jsonRPC.request(service.CHECK_LOGIN, {
            params: {
                params: {}
            },
            success: function(response) {
 
            },
            error: function(response) {
             
            }
        });

    };
    Index.prototype._doCheckLicense = function(callback) {
        var _this = this;
        $.jsonRPC.request(service.USER_INFO, {
            params: {
                params: {}
            },
            success: function(response) {
                var userGroup = response.data.user_group,
                    userStatus = response.data.user_status;
                if(userStatus == "1"){
                    xyzAlert.info('用户已注销', {
                        closeOnConfirm: true,
                        confirmButtonText: '确定',
                        confirm: function() {
                            _this._logout();
                        },
                    }, '');
                }else if(userStatus == "2"){
                    xyzAlert.info('用户已冻结', {
                        closeOnConfirm: true,
                        confirmButtonText: '确定',
                        confirm: function() {
                            _this._logout();
                        },
                    }, '');
                }else if(userStatus == "3"){
                    xyzAlert.info('用户已挂起', {
                        closeOnConfirm: true,
                        confirmButtonText: '确定',
                        confirm: function() {
                            _this._logout();
                        },
                    }, '');
                }else if(userStatus == "0"){
                    $.jsonRPC.request(service.CHECK_LICENSE, {
                        params: {
                            params: {}
                        },
                        success: function(response) {
                            _this.licenseFlag = response.data;
                            if (_this.licenseFlag == -1) {
                                xyzAlert.info('系统未导入许可,请及时导入许可', {
                                    closeOnConfirm: true,
                                    confirmButtonText: '确定',
                                    confirm: function() {
                                        if (userGroup != 1) {
                                            _this._logout();
                                        } else {
                                            _this.adminNotImportLicense = true;
                                            callback(true);
                                        }
                                    },
                                }, '');
                            } else if (_this.licenseFlag == -2) {
                                xyzAlert.info('系统许可证已过期,请及时联系新意公司', {
                                    closeOnConfirm: true,
                                    confirmButtonText: '确定',
                                    confirm: function() {
                                        if (userGroup != 1) {
                                            _this._logout()
                                        } else {
                                            callback(true);
                                        }
                                    },
                                }, '');
                            } else if (_this.licenseFlag > 0) {
                                xyzAlert.info('系统许可证还剩' + response.data + '天过期,请及时联系新意公司', {
                                    closeOnConfirm: true,
                                    confirmButtonText: '确定',
                                    confirm: function() {
                                        callback(true);
                                    }
                                }, '');
                            } else {
                                callback(true);
                            }
                        },
                        error: function(response) {
                            xyzAlert.error(response.message, {
                                closeOnConfirm: true,
                                confirmButtonText: '确定',
                                confirm: function() {
                                    _this._logout()
                                },
                            }, '');
                        }
                    });                 
                }

            },
            error: function(response) {
                xyzAlert.warning('获取用户信息失败', {
                    closeOnConfirm: false,
                    confirmButtonText: '确定',
                    confirm: function() {
                        _this._logout()
                    },
                });
            }
        });

    };

    //获取登录用户权限
    Index.prototype._getUserRight = function(app_id, callback) {
        var _this = this;
        $.jsonRPC.request(service.USER_RIGHT, {
            params: {
                params: {
                    app_id: app_id
                }
            },
            success: function(response) {
                var data = response.data;
                if ($.isFunction(callback)) {
                    callback.call(_this, data);
                }
            },
            error: function(response) {
                xyzAlert.error('页面加载出错，请重新访问该页面!');
                window.console && console.log('获取用户权限出错', response);
            }
        });
    };

    //-----------------------

    //菜单数据预处理
    Index.prototype._processMenuData = function(menuData) {
        // menuData = [{"parent_menu_code":"00000000","order_code":"010000","show_num":10,"menu_name":"系统管理","deploy_name":"EPWEBRUN","menu_level":1,"menu_code":"50021002","func_code":"00010000","app_id":0},{"parent_menu_code":"50022003","order_code":"010100","show_num":10,"menu_name":"部门管理","deploy_name":"EPWEBRUN","menu_level":3,"menu_code":"50023005","func_code":"00010100","app_id":0},{"parent_menu_code":"50023005","order_code":"010101","show_num":10,"menu_name":"部门信息维护","deploy_name":"EPWEBRUN","menu_level":4,"menu_code":"50024001","func_path":"epframe/release/esystem/department/depmanage/DepManage.html","func_code":"00010101","app_id":0},{"parent_menu_code":"50023005","order_code":"010200","show_num":10,"menu_name":"部门权限管理","deploy_name":"EPWEBRUN","menu_level":4,"menu_code":"50024002","func_code":"00010200","app_id":0},{"parent_menu_code":"50023005","order_code":"010201","show_num":10,"menu_name":"部门角色维护","deploy_name":"EPWEBRUN","menu_level":4,"menu_code":"50024003","func_path":"epframe/release/esystem/deprole/deprolemanage/DepRoleManage.html","func_code":"00010201","app_id":0},{"parent_menu_code":"50022003","order_code":"010300","show_num":10,"menu_name":"用户管理","deploy_name":"EPWEBRUN","menu_level":3,"menu_code":"50023006","func_code":"00010300","app_id":0},{"parent_menu_code":"50023006","order_code":"010301","show_num":10,"menu_name":"用户信息维护","deploy_name":"EPWEBRUN","menu_level":4,"menu_code":"50024004","func_path":"epframe/release/esystem/user/usermanage/UserManage.html","func_code":"00010301","app_id":0},{"parent_menu_code":"50023006","order_code":"010400","show_num":10,"menu_name":"用户权限管理","deploy_name":"EPWEBRUN","menu_level":4,"menu_code":"50024005","func_code":"00010400","app_id":0},{"parent_menu_code":"50023006","order_code":"010401","show_num":10,"menu_name":"用户角色维护","deploy_name":"EPWEBRUN","menu_level":4,"menu_code":"50024006","func_path":"epframe/release/esystem/userrole/userrolemanage/UserRoleManage.html","func_code":"00010401","app_id":0},{"parent_menu_code":"50022003","order_code":"010800","show_num":10,"menu_name":"审计","deploy_name":"EPWEBRUN","menu_level":3,"menu_code":"50023007","func_code":"00010800","app_id":0},{"parent_menu_code":"50023007","order_code":"010801","show_num":10,"menu_name":"登录退出日志查询","deploy_name":"EPWEBRUN","menu_level":4,"menu_code":"50024007","func_path":"epframe/release/esystem/log/uservisitlog/UserVisitLog.html","func_code":"00010801","app_id":0},{"parent_menu_code":"50023007","order_code":"010802","show_num":10,"menu_name":"操作日志查询","deploy_name":"EPWEBRUN","menu_level":4,"menu_code":"50024008","func_path":"epframe/release/esystem/log/oploginfo/OpLogInfo.html","func_code":"00010802","app_id":0},{"parent_menu_code":"50021002","order_code":"200010","show_num":10,"menu_name":"用户信息管理","deploy_name":"EPWEBRUN","menu_level":2,"menu_code":"50022003","func_code":"50022003","app_id":0}];
        var _this = this,
            hashMap = {},
            menuArr = [],
            appMap = _.indexBy(this.appList, 'app_id');
        if ($.isArray(menuData) && menuData.length > 0) {
            var i, l, code, parentCode,
                key = 'menu_code',
                parentKey = 'parent_menu_code';
            if (!key || key == "" || !menuData)
                return [];
            for (i = 0, l = menuData.length; i < l; i++) {
                if(menuData[i].func_path && menuData[i].orig_app_id && appMap[menuData[i].orig_app_id]) {//忽略前当系统，org_app_id为0的也忽略
                    menuData[i].app_url = appMap[menuData[i].orig_app_id].app_url;
                }
                hashMap[menuData[i][key]] = menuData[i];
            }
            for (i = 0, l = menuData.length; i < l; i++) {
                code = menuData[i][key];
                parentCode = menuData[i][parentKey];
                if (hashMap[parentCode] && code != parentCode) { //有父节点的情况
                    if (!hashMap[parentCode].childArr) {
                        hashMap[parentCode].childArr = [];
                    }
                    menuData[i].parentNd = hashMap[parentCode]; //父节点
                    hashMap[parentCode].childArr.push(menuData[i]);
                } else {
                    menuArr.push(menuData[i]);
                }
            }
            //表菜单按菜单排序码排序
            menuArr.sort(sortMenuData);
            //递归设置一级菜单的层级数
            function getChildLevel(pNode) {
                var totallevel = 0;
                var children = pNode.childArr;
                if (children && children.length) {
                    totallevel++;
                    var levarr = [];
                    for (var i = 0, len = children.length; i < len; i++) {
                        levarr[i] = getChildLevel(children[i]);
                    }
                    totallevel += _.max(levarr);
                    children.sort(sortMenuData);
                }
                return totallevel;
            }
            //菜单排序方法
            function sortMenuData(a, b) {
                if (a.order_code < b.order_code) {
                    return -1;
                } else if (a.order_code == b.order_code) {
                    return 0;
                } else {
                    return 1;
                }
            }
            //计算菜单层级, 以下子菜单按菜单排序码排序
            for (var i = 0, l = menuArr.length; i < l; i++) {
                menuArr[i].$totallevel = getChildLevel(menuArr[i]) + 1;
            }
        }
        _this._CACHE.MENU = {
            hashMap: hashMap,
            menuArr: menuArr
        };
    };

    //设置活动菜单
    Index.prototype._configActiveMenu = function(menuInfo) {
        var _this = this,
            activeMenu = null;
        if (undefined === menuInfo || null === menuInfo) {
            activeMenu = {
                menu_code: null,
                func_code: null,
                app_id: this.curAppId,
                orig_app_id: null
            };
        } else {
            activeMenu = {
                menu_code: menuInfo.menu_code,
                func_code: menuInfo.func_code,
                app_id: _.isUndefined(menuInfo.app_id) ? this.curAppId : menuInfo.app_id,
                orig_app_id: _.isUndefined(menuInfo.orig_app_id) ? null : menuInfo.orig_app_id
            };

        }
        baseCommon.setActiveMenu(activeMenu);
        this._saveLocalData('activeMenu', activeMenu); //保存当前页面打开菜单
        menuInfo && this.indexHistory.recordLastHistoricMenu(menuInfo.menu_code);
    };

    //折叠左侧菜单，页面最大化
    Index.prototype._collapseSideMenu = function() {
        this.jdom.index.addClass('index_collapse');
        this._adjustPanelSize();
    };

    Index.prototype._saveLocalData = function(key, data) {
        if (!this.localData) {
            this.localData = {};
        }
        this.localData[key] = data;
    };

    Index.prototype._getLocalData = function(key) {
        if (!this.localData) {
            this.localData = {};
        }
        return _.isEmpty(key) ? this.localData : this.localData[key]
    };

    Index.prototype.getMenuData = function() {
        return this._CACHE.MENU;
    }
    //获取全局数据
    Index.prototype.getGlobalData = function() {
        var user = {
            dep_code: "",
            dep_id: "",
            dep_name: "",
            is_update_pwd: "",
            user_code: "",
            user_group: "",
            user_name: "",
            user_theme: ""
        };
        if(this._CACHE.USER && this._CACHE.USER.user) {
            user = this._CACHE.USER.user;
        }
        return {
            menu: this._CACHE.MENU,
            user: user,
            appId: this.curAppId
        }
    }

    //-----------------------

    //绑定页面事件
    Index.prototype._bindEvent = function() {
        var _this = this;

        $(window).on('resize', function() {
            _this._adjustPanelSize();
        });

        //切换标题面板
        this.jdom.header_logo.find('div.submenu_toggler').on('click', function() {
            _this.jdom.index.toggleClass('index_collapse');
            _this._adjustPanelSize();
            return false;
        });
    };

    module.exports = Index;
});
