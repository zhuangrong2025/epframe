define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        format = require('objectformat'),
        observer = require('observer');
    //模板引入
    var tpl = '<div class="indexFavorite menu_wrapper hide">' 
            + '  <ul class="menu">'
            //我的收藏菜单栏
            + '    <li data-code="@$FavoriteMenu" class="open">'
            + '      <a href="javascript:void(0)"><span>我的收藏</span><span class="arrow"></span></a>'
            + '      <ul class="submenu"></ul>'
            + '    </li>'
            //我的收藏菜单栏
            + '    <li data-code="@$HistoryMenu" class="">'
            + '      <a href="javascript:void(0)"><span>历史记录</span><span class="arrow"></span></a>'
            + '      <ul class="submenu"></ul>'
            + '    </li>'
            + '  </ul>'
            + '</div>',
        menuTpl = '<li data-code="{menuCode}" class="menu_item">'
                + '  <a href="javascript:void(0)"><i></i><span>{menuName}</span></a>'
                + '</li>';
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        ADD_FAVORITE_MENU: SERVICE_GATEWAY + 'epframe.epbos_menuManageService.addFavoriteMenu',
        DEL_FAVORITE_MENU: SERVICE_GATEWAY + 'epframe.epbos_menuManageService.delFavoriteMenu',
        QUERY_FAVORITE_MENUS: SERVICE_GATEWAY + 'epframe.epbos_menuManageService.queryFavoriteMenus',
        ADD_RECENT_MENU: SERVICE_GATEWAY + 'epframe.epbos_menuManageService.addRecentMenu',
        QUERY_RECENT_MENUS: SERVICE_GATEWAY + 'epframe.epbos_menuManageService.queryRecentMenus'
    };

    var IndexFavorite = function(options) {
        this.initialize(options);
    };

    IndexFavorite.prototype = {
        initialize: function(options) {
            this.favMenus = []; //收藏菜单列表
            this.hisMenu = []; //历史菜单列表
            this.main = options.main; //首页主模块
            this.events = $.extend({
                openMenuTab: function(menuCode) {},
                changeTheme: function(theme) {}
            }, options.events);
        },
        render: function() {
            $('.index_container').append(tpl);
            this.el = $('.indexFavorite');
            this.$favMenuWrap = this.el.find('li[data-code="@$FavoriteMenu"] > .submenu');
            this.$hisMenuWrap = this.el.find('li[data-code="@$HistoryMenu"] > .submenu');
            this._bindEvent();
        },
        show: function() {
            this.el.removeClass('hide');
        }, 
        close: function() {
            this.el.addClass('hide');
        },
        refresh: function() {
            this.dispose();
            this.render();
        },
        dispose: function() {
            this.el.remove()
        }
    };

    //取消收藏
    IndexFavorite.prototype.removeFavoriteMenu = function(menuCode) {
        var m = this.menuCache[menuCode];
        if(!m) {
            return;
        }
        var _this = this;
        var callback = function() {
            //移除收藏数据
            _.remove(_this.favMenus, function(menu) {
                return menu.menuCode === menuCode
            });
            _this.$favMenuWrap.find('li[data-code=' + menuCode + ']').remove();
        }
        var globalData = this.main.getGlobalData();
        $.jsonRPC.request(service.DEL_FAVORITE_MENU, {
            params: {
                params: {
                    app_id: globalData.appId,
                    user_code: globalData.user.user_code,
                    menu_code: menuCode
                }
            },
            success: function(response) {
                callback()
            }
        });
    }
    //是否为收藏菜单
    IndexFavorite.prototype.hasFavoriteMenu = function(menuCode) {
		var index = _.findIndex(this.favMenus, function(menu) {
            return menu.menuCode == menuCode;
        });
        return index === -1 ? false : true;
    }
    //添加收藏
    IndexFavorite.prototype.addFavoriteMenu = function(menuCode) {
        var m = this.menuCache[menuCode];
        if(!m) {
            return;
        }
        var _this = this;
        var callback = function() {
            var menu = {
                menuCode: m.menu_code,
                menuName: m.menu_name
            };
            _this.favMenus.push(menu);
            _this.$favMenuWrap.append(format(menuTpl, menu));
        }
        var globalData = this.main.getGlobalData();
        $.jsonRPC.request(service.ADD_FAVORITE_MENU, {
            params: {
                params: {
                    app_id: globalData.appId,
                    user_code: globalData.user.user_code,
                    menu_code: menuCode
                }
            },
            success: function(response) {
                callback()
            }
        }); 
    }
    //添加菜单访问记录
    IndexFavorite.prototype.addHistoryMenu = function(menuCode) {
        var m = this.menuCache[menuCode];
        if(!m) {
            return;
        }
        var _this = this;
        var callback = function() {
            var index = _.findIndex(_this.hisMenu, function(m) {
                return m.menuCode == menuCode;
            });
            if(index != -1) {//历史记录中已存在该菜单, 移除并添加到列表前面
                _this.hisMenu.splice(index, 1);
                _this.$hisMenuWrap.find('li[data-code=' + menuCode + ']').remove();
            }
            var menu = {
                menuCode: m.menu_code,
                menuName: m.menu_name
            };
            _this.hisMenu.unshift(menu); //添加到列表前面
            _this.$hisMenuWrap.prepend(format(menuTpl, menu));
        }
        var globalData = this.main.getGlobalData();
        $.jsonRPC.request(service.ADD_RECENT_MENU, {
            params: {
                params: {
                    app_id: globalData.appId,
                    user_code: globalData.user.user_code,
                    menu_code: menuCode
                }
            },
            success: function(response) {
                callback()
            }
        });
    }
    IndexFavorite.prototype._renderFavoriteMenu = function() {
        var _this = this;
        var callback = function(list) {
            var html = ''
            this.favMenus = [];
            list = list || [];
            _.each(list, function(menuCode) {
                var m = this.menuCache[menuCode];
                if(m) {//不在可访问菜单列表内的菜单不添加(如无权限的菜单)
                    menu = {
                        menuCode: m.menu_code,
                        menuName: m.menu_name
                    };
                    this.favMenus.push(menu);
                    html += format(menuTpl, menu);
                }
            }, _this);
            _this.$favMenuWrap.html(html);
        }
        var globalData = this.main.getGlobalData();
        $.jsonRPC.request(service.QUERY_FAVORITE_MENUS, {
            params: {
                params: {
                    app_id: globalData.appId,
                    user_code: globalData.user.user_code
                }
            },
            success: function(response) {
                var list = response.data;
                callback(list);
            }
        });
        //this.removeFavoriteMenu("50022003");
    }
    IndexFavorite.prototype._renderHistoryMenu = function() {
        var _this = this;
        var callback = function(list) {
            list = list || [];
            var html = ''
            _this.hisMenu = [];
            _.each(list, function(menuCode) {
                var m = this.menuCache[menuCode];
                if(m) {//不在可访问菜单列表内的菜单不添加(如无权限的菜单)
                    var menu = {
                        menuCode: m.menu_code,
                        menuName: m.menu_name
                    };
                    this.hisMenu.push(menu);
                    html += format(menuTpl, menu);
                }
                    
            }, _this);
            _this.$hisMenuWrap.html(html);
        }
        var globalData = this.main.getGlobalData();
        $.jsonRPC.request(service.QUERY_RECENT_MENUS, {
            params: {
                params: {
                    app_id: globalData.appId,
                    user_code: globalData.user.user_code,
                    show_num: 10 //显示10条
                }
            },
            success: function(response) {
                var list = response.data;
                callback(list);
            }
        });
    }
    IndexFavorite.prototype._changeMenuGroup = function(target, open) {
		var item = $(target),
            parent = item.parent('.menu'),
            subItem = item.find('>.submenu');
        //验证二级菜单
        if (parent.size() > 0) {
            if (!item.hasClass('open') || open === true) {
                subItem.css('height', 'auto');
                var subHeight = subItem.height() + 'px';
                subItem.css('height', '0px');
                item.css('overflow-y', 'hidden');
                item.addClass('open');
                subItem.css('height', subHeight);
                setTimeout(function() {
                    //添加open样式判断，避免连续点击出现滚动条的情况
                    item.hasClass('open') && item.css('overflow-y', 'auto');
                }, 350);
            } else {
                item.css('overflow-y', 'hidden');
                item.removeClass('open');
                subItem.css('height', '0px');
            }
            //关闭同级别菜单
            item.siblings().removeClass('open').css('overflow-y', 'hidden');
        }
    }
    //切换左侧菜单项
    IndexFavorite.prototype._changeMenuItem = function(target) {
        var item = $(target),
            parent = item.parent('.submenu'),
            pItem = item.parent().closest('li'),
            pSiblingItem = pItem.siblings();
        //存在上级菜单，切换选中状态
        if (parent.length) {
            pSiblingItem.removeClass('active');
            pSiblingItem.find('.submenu>li').removeClass('active'); 
            pItem.addClass('active');
        } else {//取消同级菜单及下级菜单选中状态
            //关闭同级别菜单
            item.siblings().removeClass('open').css('overflow-y', 'hidden');
            item.siblings().find('.submenu>li').removeClass('active'); 
        }
        item.siblings().removeClass('active');
        item.addClass('active');
        if ($.isFunction(this.events.openMenuTab)) {
            this.events.openMenuTab(item.dataString('code'));
        }
    };
    //绑定页面事件
    IndexFavorite.prototype._bindEvent = function() {
        var _this = this;
        observer.on('loadMenu', function(data) {
            _this.menuCache = data && data.hashMap ? data.hashMap : {};
            //console.log(data)
            _this._renderFavoriteMenu();
            _this._renderHistoryMenu();
        });
        this.el.find
        //切换左侧菜单组
        this.el.on('click', '.menu li:not(.menu_item)', function() {
            _this._changeMenuGroup(this);
            return false;
        });
        //点击左侧菜单组
        this.el.on('click', '.menu li.menu_item', function() {
            _this._changeMenuItem(this);
            return false;
        });
    }
    //初始化
    module.exports = IndexFavorite;
});
