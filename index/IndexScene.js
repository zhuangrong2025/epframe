define(function(require, exports, module) {

    var $ = require('jquery'),
        format = require('objectformat');

    //模板引入
    var sceneMainTpl = require('./template/IndexSceneOfMain.html'),
        navigationTpl = '<a class="active" href="javascript:void(0)" data-code="{code}" data-action="{action}">' +
        '    <span>{name}</span> <i class="xy-icon xy-delete2"></i>' +
        '</a>',
        contentTpl = '<iframe width="100%" class="active" data-code="{code}" data-action="{action}" data-src="{url}" allowFullScreen="true" loading></iframe>';

    function IndexScene(options) {
        this.initialize(options);
    };

    IndexScene.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            this.main = options.main;
            this.jdom = {};
            this._CACHE = {};
            this._CACHE.CUST = {};//自定义菜单集
            this.app_url_loaded = {}; //子系统菜单加载状态, 只记录是否加载过
			this.war_loaded = {}; //war包加载状态
            this.events = $.extend({
                changeScene: function(code, data, options) {}
            }, options.events);
        },
        render: function() {
            this.el.html(sceneMainTpl);
            this._init();
            this._bindEvent();
            var _this = this;
           window.openSelfMenuTab = function(menuCode){
                _this.openMenuTab.call(_this,menuCode,{fromMenu: false});
            } 
            return this;
        },
        refresh: function() {
            this._closeAllTabs();
        }
    };

    //初始化
    IndexScene.prototype._init = function() {
        var path = window.location.pathname,
            webName = path.split('/')[1];
        this.webName = webName;
        var jdom = this.jdom;

        //content zone
        jdom.content_wrapper = this.el;
        jdom.content_tabs = jdom.content_wrapper.find('>div.content_tabs');
        jdom.tabs_list_wrapper = jdom.content_tabs.find('div.tabs_list_wrapper');
        jdom.tabs_list = jdom.tabs_list_wrapper.find('>div.tabs_list');
        jdom.content_main = jdom.content_wrapper.find('>div.content_main');
        jdom.tab_favorite = this.jdom.content_tabs.find('>.tab_favorite');
    };

    //-----------------------
    //设置菜单数据
    IndexScene.prototype.setMenuData = function(menuData) {
        this._CACHE.MENU = menuData;
    };
	IndexScene.prototype.setAppData = function(appData) {
        this._CACHE.APP_CACHE = appData;
    };
    //获取自定义菜单数据
    IndexScene.prototype.getCustData = function() {
        return this._CACHE.CUST
    };

    //打开自定义tab页面
    IndexScene.prototype.openCustomedTab = function(tabCode, tabName, tabUrl, closable) {
        this._changeTab('@$' + tabCode, {
            url: tabUrl,
            name: tabName,
            closable: closable
        });
    };

    //打开菜单tab页面
    IndexScene.prototype.openMenuTab = function(menuCode, options) {
        menuCode = '' + menuCode;
        var menuInfo = this._CACHE.MENU.hashMap[menuCode];
        if (null != menuInfo &&
            0 != $.trim(menuInfo.deploy_name).length && 0 != $.trim(menuInfo.func_path).length) {
            this._changeTab(menuCode, options);
        } else {
            window.console && console.log('错误菜单', menuInfo);
        }
    };

    //定位当前选项卡
    IndexScene.prototype.locateTabPosition = function() {
        this._moveTabLacation();
    };

    //切换主题
    IndexScene.prototype.changeTheme = function(iframeTheme) {
        this.jdom.content_main.find('>iframe').each(function() {
            if (this.contentWindow.ModulesGlobal && this.contentWindow.ModulesGlobal.changeStyle) {
                this.contentWindow.ModulesGlobal.changeStyle(iframeTheme);
            } else if (this.contentWindow.ModulesGlobal &&
                this.contentWindow.ModulesGlobal.BaseCommonModule &&
                this.contentWindow.ModulesGlobal.BaseCommonModule.changeStyle) {
                this.contentWindow.ModulesGlobal.BaseCommonModule.changeStyle(iframeTheme);
            }
        });
    };

    //停止所有打开页面的业务处理, 对页面发起停止的通知
    IndexScene.prototype.setTabsStop = function(iframeTheme) {
        this.jdom.content_main.find('>iframe').each(function() {
            if (this.contentWindow.ModulesGlobal && this.contentWindow.ModulesGlobal.Observer &&
                $.isFunction(this.contentWindow.ModulesGlobal.Observer.trigger)) {
                this.contentWindow.ModulesGlobal.Observer.trigger('index.stop');
            }
        });
    };

    //恢复所有打开页面的业务处理, 对页面发起恢复的通知
    IndexScene.prototype.setTabsRun = function(iframeTheme) {
        this.jdom.content_main.find('>iframe').each(function() {
            if (this.contentWindow.ModulesGlobal && this.contentWindow.ModulesGlobal.Observer &&
                $.isFunction(this.contentWindow.ModulesGlobal.Observer.trigger)) {
                this.contentWindow.ModulesGlobal.Observer.trigger('index.run');
            }
        });
    };
    //-----------------------
    var maxReg = /(.*?)((?:\?|&)maximize=1)(&)*/g; //菜单最大化参数正则表达式
    //切换tab
    IndexScene.prototype._changeTab = function(code, options) {
        options = options || {};
        var tab, iframe, isCustom, menuInfo, url, name, appId;
        if (0 == $.trim(code).length) {
            throw 'Wrong argument "' + code + '" to open tab';
        }

        if (0 == code.indexOf('@$')) {
            tab = this.jdom.tabs_list.find('>a[data-code="\\@\\$' + code.substring(2) + '"]');
            iframe = this.jdom.content_main.find('>iframe[data-code="\\@\\$' + code.substring(2) + '"]');
            isCustom = true;
        } else {
            tab = this.jdom.tabs_list.find('>a[data-code=' + code + ']');
            iframe = this.jdom.content_main.find('>iframe[data-code="' + code + '"]');
            isCustom = false;
        }

        if (tab.hasClass('active')) {
            return
        }
        //定制菜单不显示收藏
        isCustom ? this.jdom.content_tabs.addClass('no_favorite') : this.jdom.content_tabs.removeClass('no_favorite');

        if (tab.size() > 0) {
            tab.addClass('active').siblings().removeClass('active');
            iframe.addClass('active').siblings().removeClass('active');
            if (!isCustom) {
                menuInfo = this._CACHE.MENU.hashMap[code];
            }
        } else {
            if (isCustom) {
                url = options.url;
                name = options.name;
                this._CACHE.CUST[code] = {
                    code: code,
                    name: name, 
                    url: url,
                    closable: options.closable === false ? false : true
                };
            } else {
                menuInfo = this._CACHE.MENU.hashMap[code];
				var appMap = this._CACHE.APP_CACHE;
				
                appId = menuInfo.app_id;
                var app_url = menuInfo.app_url || '',
					isCurWeb = menuInfo.deploy_name == this.webName || menuInfo.deploy_name == 'EPWEBRUN',
					menuWebName = isCurWeb ? this.webName : menuInfo.deploy_name,	//菜单web工程名
					menuAppId = isCurWeb ? appId : menuInfo.orig_app_id; //菜单所属app_id
                url = [app_url, menuInfo.deploy_name, menuInfo.func_path].join('/');
                //复杂度有点高，有待优化 chenming 2019-03-06
                if (maxReg.test(url)) {
                    url = url.replace(maxReg, function(match, path, maxstr, sp) {
                        var isFirst = path.indexOf('?') === -1 ? true : false, //最大化参数是否为第一个参数
                            hasNext = sp ? true : false,
                            nextPath = hasNext ? (isFirst ? '?' : '&') : '';
                        return path + nextPath;
                    });
                }
                url += ((url.indexOf('?') === -1) ? '?' : '&') + '_func_code=' + menuInfo.func_code;
                if(this.webName && !this.app_url) {//本地菜单, EPWEBRUN替换成实际工程名
                    url = url.replace(/\/EPWEBRUN\//g, '/' + this.webName + '/');
                }
                if (!isCurWeb && !this.war_loaded[menuWebName] && appMap[menuAppId] && !appMap[menuAppId].app_type == '0') { //首次加载，转向做登录认证
					var sendUrl = [app_url, appMap[menuAppId].app_path, 'redirect.html'].join('/');
					url = sendUrl + '?url=' + encodeURIComponent(url);
                    this.war_loaded[menuWebName] = true;
                }
                name = menuInfo.menu_name;
            }
            this.jdom.tabs_list.find('>a.active').removeClass('active');
            this.jdom.content_main.find('>iframe.active').removeClass('active');
            tab = $(format(navigationTpl, { code: code, name: name, action: options.closable === false ? 'none' : 'closable'}));
            iframe = $(format(contentTpl, { code: code, url: url, action: options.closable === false ? 'none' : 'closable' }));
            this.jdom.tabs_list.append(tab);
            this.jdom.content_main.append(iframe);
        }

        if ($.isFunction(this.events.changeScene)) {
            this.events.changeScene(code, (undefined === menuInfo ? null : menuInfo), (undefined === options ? null : options));
        }

        iframe = this.jdom.content_main.find('>iframe[loading]');
        if (iframe.size() > 0) {
            setTimeout(function() {
                iframe.removeAttr('loading');
                iframe.each(function() {
                    var $this = $(this);
                    $this.attr('src', $this.data('src'))
                });
            }, 300);
        }
        !isCustom && this.main.indexFavorite.addHistoryMenu(code);//添加访问记录
        if(this.main.indexFavorite.hasFavoriteMenu(code)) {//已收藏，显示收藏状态
            //this.jdom.tab_favorite.addClass('favShow');
            this.jdom.tab_favorite.find('>i:last').addClass('favShow').siblings().removeClass('favShow');
        } else { //未收藏状态
            this.jdom.tab_favorite.find('>i:first').addClass('favShow').siblings().removeClass('favShow');
        }
        //console.log('is fav:'+this.main.indexFavorite.hasFavoriteMenu(code));
        this._moveTabLacation();
    };

    //关闭tab
    IndexScene.prototype._closeTab = function(code) {
        var tab, iframe, activeMenu, activeTab, activeIframe,
            activeCode = null;
        if (0 == code.indexOf('@$')) {
            tab = this.jdom.tabs_list.find('>a[data-code="\\@\\$' + code.substring(2) + '"]');
            iframe = this.jdom.content_main.find('>iframe[data-code="\\@\\$' + code.substring(2) + '"]');
        } else {
            tab = this.jdom.tabs_list.find('>a[data-code=' + code + ']');
            iframe = this.jdom.content_main.find('>iframe[data-code="' + code + '"]');
        }
        activeTab = this.jdom.tabs_list.find('>a.active[data-code]');
        if (code === activeTab.dataString('code')) {
            activeTab = tab.prev();
        }
        if (0 == activeTab.size()) {
            activeTab = tab.next();
        }
        tab.remove();
        iframe.remove();
        if (activeTab.size() > 0) {
            activeCode = activeTab.dataString('code');
            if (0 == activeCode.indexOf('@$')) {
                activeIframe = this.jdom.content_main.find('>iframe[data-code="\\@\\$' + activeCode.substring(2) + '"]');
            } else {
                activeMenu = this._CACHE.MENU.hashMap[activeCode];
                activeIframe = this.jdom.content_main.find('>iframe[data-code="' + activeCode + '"]');
            }
            activeTab.addClass('active').siblings().removeClass('active');
            activeIframe.addClass('active').siblings().removeClass('active');
        }
        if ($.isFunction(this.events.changeScene)) {
            this.events.changeScene(activeCode, (undefined === activeMenu ? null : activeMenu), null);
        }
        this._moveTabLacation();
    };

    //tab：刷新
    IndexScene.prototype._refreshCurrentTab = function() {
        var iframe = this.jdom.content_main.find('>iframe.active');
        if (iframe.size() > 0) {
            iframe[0].contentWindow.location.reload();
        }
    };

    //tab：向前
    IndexScene.prototype._transTabPageNext = function() {
        var curLeft = Math.abs(parseInt(this.jdom.tabs_list.css('left').replace('px', ''))),
            viewWidth = this.jdom.tabs_list.data('viewWidth'),
            lastRightestLeft = this.jdom.tabs_list.data('lastRightestLeft');
        viewWidth = undefined === viewWidth ? 100 : viewWidth;
        lastRightestLeft = undefined === lastRightestLeft ? 0 : lastRightestLeft;
        curLeft += viewWidth;
        curLeft = (curLeft > lastRightestLeft) ? lastRightestLeft : curLeft;
        this.jdom.tabs_list.css('left', (-curLeft) + 'px');
        this._changeTabCtlBtnStatus();
    };

    //tab：向后
    IndexScene.prototype._transTabPagePrev = function() {
        var curLeft = Math.abs(parseInt(this.jdom.tabs_list.css('left').replace('px', ''))),
            viewWidth = this.jdom.tabs_list.data('viewWidth');
        viewWidth = undefined === viewWidth ? 100 : viewWidth;
        curLeft -= viewWidth;
        curLeft = (curLeft < 0) ? 0 : curLeft;
        this.jdom.tabs_list.css('left', (-curLeft) + 'px');
        this._changeTabCtlBtnStatus();
    };

    //tab：按钮状态
    IndexScene.prototype._changeTabCtlBtnStatus = function() {
        var _this = this;
        setTimeout(function() {
            var curLeft = Math.abs(parseInt(_this.jdom.tabs_list.css('left').replace('px', ''))),
                lastRightestLeft = _this.jdom.tabs_list.data('lastRightestLeft');
            lastRightestLeft = undefined === lastRightestLeft ? 0 : lastRightestLeft;
            if (undefined === curLeft || 0 === curLeft) {
                _this.jdom.content_tabs.find('>.tabs_prev').addClass('disabled');
            } else {
                _this.jdom.content_tabs.find('>.tabs_prev').removeClass('disabled');
            }
            if (undefined === curLeft || undefined === lastRightestLeft || 0 === lastRightestLeft || curLeft >= lastRightestLeft) {
                _this.jdom.content_tabs.find('>.tabs_next').addClass('disabled');
            } else {
                _this.jdom.content_tabs.find('>.tabs_next').removeClass('disabled');
            }
        }, 350);
        //刷新当前页面
        if (this.jdom.tabs_list.find('>a').size() > 0) {
            this.jdom.content_tabs.find('>.tabs_dropdown .refresh_current').removeClass('disabled');
        } else {
            this.jdom.content_tabs.find('>.tabs_dropdown .refresh_current').addClass('disabled');
        }
        //关闭所有，不包括不可关闭的页面
        if (this.jdom.tabs_list.find('>a:not([data-action=none])').size() > 0) {
            this.jdom.content_tabs.find('>.tabs_dropdown .locate_current').removeClass('disabled');
            this.jdom.content_tabs.find('>.tabs_dropdown .close_all').removeClass('disabled');
        } else {
            this.jdom.content_tabs.find('>.tabs_dropdown .locate_current').addClass('disabled');
            this.jdom.content_tabs.find('>.tabs_dropdown .close_all').addClass('disabled');
        }
        if (this.jdom.tabs_list.find('a:not([data-action=none])').filter(function() { return !$(this).hasClass('active') }).size() > 0) {
            this.jdom.content_tabs.find('>.tabs_dropdown .closs_other').removeClass('disabled');
        } else {
            this.jdom.content_tabs.find('>.tabs_dropdown .closs_other').addClass('disabled');
        }
    };

    //tab：位置定位
    IndexScene.prototype._moveTabLacation = function() {
        var _this = this,
            otherWidth = 0,
            viewWidth = 0,
            totalWidth = 0,
            activeItemWidth = 0,
            activeLeft,
            activeLeftestLeft = 0,
            activeRightestLest = 0,
            flag = false;
        this.jdom.content_tabs.find('>.tabs_ctrl:visible').each(function() {
            otherWidth += $(this).outerWidth();
        });
        viewWidth = Math.ceil(this.jdom.content_tabs.width() - otherWidth);
        viewWidth = (viewWidth < 0) ? 0 : viewWidth;
        //计算最小最大左边距
        this.jdom.tabs_list.css('width', 'auto').find('>a').each(function() {
            var item = $(this),
                itemWidth = item.outerWidth();
            totalWidth += itemWidth;
            if (!flag) {
                if (item.hasClass('active')) {
                    flag = true;
                    activeLeftestLeft = Math.ceil(activeLeftestLeft);
                    activeItemWidth = itemWidth;
                    activeLeft = Math.abs(parseInt(_this.jdom.tabs_list.css('left').replace('px', '')));
                } else {
                    activeLeftestLeft += itemWidth;
                }
            }
        });
        totalWidth = Math.ceil(totalWidth + 1);
        //1像素为为最右侧边框修正
        activeRightestLest = Math.floor(activeLeftestLeft - 1 - viewWidth + activeItemWidth);
        activeRightestLest = activeRightestLest < 0 ? 0 : activeRightestLest;
        this.jdom.tabs_list.width(totalWidth);

        var adjustLeft,
            lastItem,
            lastItemWidth,
            mockLastLeftestLeft,
            mockLastRightestLeft;
        //活动tab预调整位置调整
        if (activeLeft < activeRightestLest || activeLeft > activeLeftestLeft) {
            adjustLeft = (Math.abs(activeRightestLest - activeLeft) < Math.abs(activeLeftestLeft - activeLeft)) ? activeRightestLest : activeLeftestLeft;
        }

        //最后一个tab位置调整
        lastItem = this.jdom.tabs_list.find('>a:last');
        if (lastItem.size() > 0) {
            lastItemWidth = lastItem.outerWidth();
            mockLastLeftestLeft = totalWidth - lastItemWidth;
            mockLastLeftestLeft = Math.ceil(mockLastLeftestLeft < 0 ? 0 : mockLastLeftestLeft);
            mockLastRightestLeft = Math.floor(mockLastLeftestLeft - 1 - viewWidth + lastItemWidth);
            mockLastRightestLeft = mockLastRightestLeft < 0 ? 0 : mockLastRightestLeft;
            if (undefined === adjustLeft) {
                adjustLeft = (activeLeft > mockLastRightestLeft) ? mockLastRightestLeft : adjustLeft;
            }
        }

        this.jdom.tabs_list.data('viewWidth', viewWidth);
        this.jdom.tabs_list.data('totalWidth', totalWidth);
        this.jdom.tabs_list.data('lastRightestLeft', undefined === mockLastRightestLeft ? 0 : mockLastRightestLeft);

        //小于展示区域调整
        adjustLeft = (viewWidth >= totalWidth) ? 0 : adjustLeft;

        if (undefined !== adjustLeft) {
            this.jdom.tabs_list.css('left', (-adjustLeft) + 'px');
        }
        this._changeTabCtlBtnStatus();
    };

    //关闭其它选项卡
    IndexScene.prototype._closeOtherTabs = function() {
        var item = this.jdom.tabs_list.find('>a.active');
        this.jdom.tabs_list.find('>a:not([data-action=none])').not(item).remove();
        item = this.jdom.content_main.find('>iframe.active');
        this.jdom.content_main.find('>iframe:not([data-action=none])').not(item).remove();
        this._moveTabLacation();
    };

    //关闭所有选项卡
    IndexScene.prototype._closeAllTabs = function() {
        this.jdom.tabs_list.find('>a:not([data-action=none])').remove();
        this.jdom.content_main.find('>iframe:not([data-action=none])').remove();
        if ($.isFunction(this.events.changeScene)) {
            this.events.changeScene(null, null, null);
        }
        this._moveTabLacation();
        var uncloseTab = this.jdom.tabs_list.find('>a[data-action=none]');
        if(uncloseTab.length) {
            var activeTab = uncloseTab.eq(0),
                activeCode = activeTab.dataString('code');
            this._changeTab(activeCode);
        }
    };

    //绑定页面事件
    IndexScene.prototype._bindEvent = function() {
        var _this = this;

        //tab向前
        this.jdom.content_tabs.find('>.tabs_next').on('click', function() {
            _this._transTabPageNext();
            return false;
        });

        //tab向后
        this.jdom.content_tabs.find('>.tabs_prev').on('click', function() {
            _this._transTabPagePrev();
            return false;
        });

        //tab下拉菜单
        this.jdom.content_tabs.find('>.tabs_dropdown').on('click', 'li', function() {
            var item = $(this);
            if (item.hasClass('locate_current')) {
                _this._moveTabLacation();
            } else if (item.hasClass('refresh_current')) {
                _this._refreshCurrentTab();
            } else if (item.hasClass('closs_other')) {
                _this._closeOtherTabs();
            } else if (item.hasClass('close_all')) {
                _this._closeAllTabs();
            }
            return false;
        });
        //添加/取消收藏
        this.jdom.tab_favorite.on('click', function() {
            var activeTab = _this.jdom.tabs_list.find('>a.active[data-code]');
                activeCode = activeTab.dataString('code');
            if(_this.main.indexFavorite.hasFavoriteMenu(activeCode)) {//取消收藏
                _this.jdom.tab_favorite.find('>i:first').addClass('favShow').siblings().removeClass('favShow');
                _this.main.indexFavorite.removeFavoriteMenu(activeCode);
            } else {//添加收藏
                _this.jdom.tab_favorite.find('>i:last').addClass('favShow').siblings().removeClass('favShow');
                _this.main.indexFavorite.addFavoriteMenu(activeCode);
            }
        });

        //切换/关闭tab
        this.jdom.tabs_list.on('click', '>a', function(e) {
            var code = $(this).dataString('code');
            if ($(e.target).is('i')) {
                //关闭tab
                _this._closeTab(code);
            } else {
                //切换tab
                _this._changeTab(code);
            }
            return false;
        });
    };

    module.exports = IndexScene;
});
