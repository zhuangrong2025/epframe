define(function(require, exports, module) {

    var $ = require('jquery'),
        _ = require('lodash'),
        format = require('objectformat'),
		storage = require('xyz-storage'),
        utils = require('../public/lib/utils');

    //模板引入
    var headerMenuTpl = require('./template/IndexMenuOfHeader.html'),
        broadsideMenuTpl = '<div class="index_broadside menu_wrapper"></div>',
        topMenuTpl = require('./template/IndexMenuOfTopMenu.html'),
        subMenuTpl = '<ul class="menu">{menu}</ul>',
        subMenuItemTpl = '<li data-code="{menuCode}" class="{menuCls}">' +
                         '   <a href="javascript:void(0)">' +
                         '        <span>{menuName}</span>' +
                         '        <span class="arrow"></span>' +
                         '    </a>' +
                         '    {fragMenu}' +
                         '</li>',
        fragMenuTpl = '<ul class="submenu">{submenu}</ul>',
        fragMenuItemTpl = '<li data-code="{menuCode}" class="menu_item">' +
                          '<a href="javascript:void(0)"><i></i><span>{menuName}</span></a>' +
                          '</li>';
							
	var path = window.location.pathname,
        webName = path.split('/')[1],
		menuOpenSessKey = webName.toLowerCase() + '_menu_open';

    function IndexMenu(options) {
        this.initialize(options);
    };

    IndexMenu.prototype = {
        initialize: function(options) {
            this.el_header = $(options.el_header);
            this.el_broadside = $(options.el_broadside);
            this.el_header.html(headerMenuTpl);
            this.el_broadside.html(broadsideMenuTpl);
            this.jdom = {};
            this._CACHE = {
                activeCode: null
            };
            this.events = $.extend({
                changeMenu: function(menuCode) {},
                clickTopMenu: function(menuCode) {}
            }, options.events);
        },
        render: function() {
            this._init();
            this._bindEvent();
        }
    };

    //初始化
    IndexMenu.prototype._init = function() {
		storage.setSessItem(menuOpenSessKey, [], 100000);
        var jdom = this.jdom;

        //header zone
        jdom.header_menu = this.el_header;
        jdom.menu_list = jdom.header_menu.find('>.menu_inner .menu_list');
        //broadside zone
        jdom.broadside_wrapper = this.el_broadside;
        jdom.broadside = jdom.broadside_wrapper.find('>div.index_broadside');

        this._renderTopMenu();
        this._renderSubMenu();
        this._changeTopMenuCtlBtnStatus();
    };

    //----------------------- 开放接口 - start

    //设置菜单数据
    IndexMenu.prototype.setMenuData = function(menuData, render) {
        this._CACHE.MENU = menuData;
        this._CACHE.activeCode = null;
        if (true === render) {
            this.render();
        }
    };

    //设置活动菜单代码
    IndexMenu.prototype.setActiveCode = function(activeCode, render) {
        this._CACHE.activeCode = activeCode;
        if (false !== render) {
            this._changeActiveMenu(false);
        }
    };

    //定位菜单位置
    IndexMenu.prototype.locateMemuPostion = function() {
        this._locateTopMemuPostion();
        this._locationSubMenuPostion();
    };

    //----------------------- 开放接口 - end

    //渲染顶级菜单
    IndexMenu.prototype._renderTopMenu = function() {
        var menuArr = this._CACHE.MENU.menuArr,
            html = '', menuCls = false;
        $.each(menuArr, function(i, item) {
            menuCls = item.childArr && item.childArr.length && item.$totallevel > 3 ? 'dropdown_wrapper' : 'menu_item';
            _.assign(item, {
                cls : menuCls
            });
        });
        html = utils.tmpl(topMenuTpl, {menus: menuArr});
        this.jdom.menu_list.html(html);
    };

    //渲染次级菜单
    IndexMenu.prototype._renderSubMenu = function(topMenuCode) {
        var _this = this;
		var codeList = [];
        if (null == topMenuCode) {
            this.jdom.broadside.empty();
            this.jdom.broadside.data('code', '');
        } else {
            var topMenu = this._CACHE.MENU.hashMap[topMenuCode],
                menuArr = null,
                hasChild = false,
                html = '';
            if (topMenu) {
                menuArr = topMenu.childArr;
                if(menuArr && menuArr.length) {
                    $.each(menuArr, function(i, data) {
                        hasChild = data.childArr && data.childArr.length ? true : false;
                        html += format(subMenuItemTpl, {
                            menuCode: data.menu_code,
                            menuName: data.menu_name,
                            menuCls : hasChild ? '' : 'menu_item',
                            fragMenu: hasChild ? _this._renderFragMenu(data.childArr) : ''
                        });
                    });
                } 
                html = format(subMenuTpl, { menu: html });
				codeList = _.pluck(menuArr, 'menu_code');
            }
            this.jdom.broadside.html(html);
            this.jdom.broadside.data('code', topMenuCode);
			var openCache = storage.getSessItem(menuOpenSessKey) || [];
            var actCode = _.intersection(codeList, openCache);
            this._changeSideMenuGroup($('.menu').find('li[data-code="' + actCode[0] + '"]'), true);
        }
    };

    //渲染子次级菜单
    IndexMenu.prototype._renderFragMenu = function(fragMenuData) {
        var html = '';
        if ($.isArray(fragMenuData)) {
            $.each(fragMenuData, function(i, data) {
                html += format(fragMenuItemTpl, {
                    menuCode: data.menu_code,
                    menuName: data.menu_name
                });
            });
            html = format(fragMenuTpl, { submenu: html });
        }
        return html;
    };
    //获取当前菜单的完整菜单路径
    IndexMenu.prototype._getFullMenus = function() {
        var activeCode = this._CACHE.activeCode,
            activeMenu = this._CACHE.MENU.hashMap[activeCode];
        
        function putParentMenu(menu) {
            if(menu.parentNd) {
                menus.push(menu.parentNd);
                putParentMenu(menu.parentNd);
            }
        }
        var menus = [activeMenu];
        putParentMenu(activeMenu);
        //反转数组，顶级置于前
        menus = _(menus).reverse().value();
        var isTopMenu = false;
        _.each(menus, function(menu, i) {
            if(i === 0 || menu.parentNd.$totallevel > 3) {//二级菜单的情况，仍然从顶部菜单查找
                isTopMenu = true;
            } else {
                isTopMenu = false;
            }
            _.assign(menu, {$level: i+1, $leaf: i == menus.length - 1, $top_menu: isTopMenu});
        }, this);
        
        return menus;
    }

    //切换活动菜单
    IndexMenu.prototype._changeActiveMenu = function(fromMenu) {       
        var activeCode = this._CACHE.activeCode;
        if (activeCode && -1 == activeCode.indexOf('@$')) {
            var menus = this._getFullMenus(), $item;
            _.each(menus, function(menu) {
                if(menu.$top_menu) {//顶部菜单
                    $item = this.jdom.menu_list.find('li[data-code=' + menu.menu_code + ']');
                    !fromMenu && this._changeTopMenuItem($item);
                } else {//左侧菜单
                    $item = this.jdom.broadside.find('li[data-code=' + menu.menu_code + ']');
                    menu.$leaf ? this._changeSideMenuItem($item) : this._changeSideMenuGroup($item, true);
                }
            }, this);
            if (true !== fromMenu) {
                this._locateTopMemuPostion();
            }
            this._locationSubMenuPostion();
        } else {
            if (true !== fromMenu && (!activeCode || 0 === activeCode.indexOf('@$'))) {
                this.jdom.broadside.find('.menu>li.open').removeClass('open').css('overflow-y', 'hidden');
                this.jdom.broadside.find('.menu>li.active').removeClass('active');
                this.jdom.broadside.find('.submenu>li.active').removeClass('active');
            }
        }
    };

    //切换一级菜单
    IndexMenu.prototype._changeL1Menu = function(target) {
        var item = $(target),
            parent = item.parent('.menu_list');
        //验证一级菜单
        if (parent.size() > 0) {
            item.addClass('active');
            item.siblings().removeClass('active');
            var l1MenuCode = item.dataString('code'),
                tmpMenuCode = this.jdom.broadside.dataString('code');
            if ('' == tmpMenuCode || tmpMenuCode != l1MenuCode) {
                this._renderSubMenu(l1MenuCode);
            }
            this._changeActiveMenu(true);
        }
    };

    //切换顶部菜单
    IndexMenu.prototype._changeTopMenuItem = function(target) {
        var item = $(target),
            parent = item.parent('.dropdown_menu'),
            pItem = item.parent().closest('li'),
            pSiblingItem = pItem.siblings();
        //存在上级菜单，切换选中状态
        if (parent.length) {
            pSiblingItem.removeClass('active');
            pSiblingItem.find('.dropdown_menu>li').removeClass('active'); 
            pItem.addClass('active');
        } else {//取消同级菜单及下级菜单选中状态
            //关闭同级别菜单
            item.siblings().find('.dropdown_menu>li').removeClass('active'); 
        }
        item.siblings().removeClass('active');
        item.addClass('active');
        var menuCode = item.dataString('code'),
            tmpMenuCode = this.jdom.broadside.dataString('code');
        if ('' == tmpMenuCode || tmpMenuCode != menuCode) {
            this._renderSubMenu(menuCode);
        }
        //this._changeActiveMenu(true); //删除该行，否则会执行两次菜单加载
    };

    //切换左侧菜单组
    IndexMenu.prototype._changeSideMenuGroup = function(target, open) {
        var item = $(target),
            parent = item.parent('.menu'),
            subItem = item.find('>.submenu');
        //验证二级菜单
        if (parent.size() > 0) {
			var code = $(item).attr('data-code');
            var sessObj = storage.getSessItem(menuOpenSessKey) || [];
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
				sessObj = _.union(sessObj, [code]);
                var otherOpen = item.siblings('.open');
                if(otherOpen.length){               //关闭同级别菜单
                    //ysj 记住各个主菜单下，左侧菜单展开过的菜单
                    var oCode = otherOpen.attr('data-code');
                    _.remove(sessObj, function(_so){
                        return _so === oCode;
                    });
                    otherOpen.removeClass('open').css('overflow-y', 'hidden');
                }
                storage.setSessItem(menuOpenSessKey, sessObj, 100000);
            } else {
                item.css('overflow-y', 'hidden');
                item.removeClass('open');
                subItem.css('height', '0px');
				_.remove(sessObj, function(_so){
                    return _so === code;
                });
                storage.setSessItem(menuOpenSessKey, sessObj, 100000);
            }
        }
		var activeObj = storage.getSessItem('active_menu');
        if(activeObj){
            var activeCode = activeObj.menu_code;
            var curDom = $('.menu').find('li[data-code="' + activeCode + '"]');
            curDom.addClass('active');
            curDom.parent().parent('li').addClass('active');
        }
    };

    //切换左侧菜单项
    IndexMenu.prototype._changeSideMenuItem = function(target) {
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
        if ($.isFunction(this.events.changeMenu)) {
            this.events.changeMenu(item.dataString('code'));
        }
    };

    //顶级菜单换页：上一页
    IndexMenu.prototype._transTopMenuPagePrev = function() {
        var curIndex = this.jdom.menu_list.data('curIndex');
        if (curIndex > 0) {
            curIndex--;
            this.jdom.menu_list.css('top', -100 * curIndex + '%').data('curIndex', curIndex);
        }
        this._changeTopMenuCtlBtnStatus();
    };

    //顶级菜单换页：下一页
    IndexMenu.prototype._transTopMenuPageNext = function() {
        var curIndex = this.jdom.menu_list.data('curIndex'),
            maxIndex = this.jdom.menu_list.data('maxIndex');
        if (curIndex < maxIndex) {
            curIndex++;
            this.jdom.menu_list.css('top', -100 * curIndex + '%').data('curIndex', curIndex);
        }
        this._changeTopMenuCtlBtnStatus();
    };

    //切换顶级菜单控制按钮状态
    IndexMenu.prototype._changeTopMenuCtlBtnStatus = function() {
        if(!this.jdom.menu_list) {//避免初始进入报错，但报错是偶发的
            return;
        }
        var curIndex = this.jdom.menu_list.data('curIndex'),
            maxIndex,
            lastItem = this.jdom.menu_list.find('>li:last');
        if (null === curIndex || undefined === curIndex) {;
            this.jdom.menu_list.data('curIndex', (curIndex = 0));
        }
        if (lastItem.size() > 0) {
            var height = lastItem.outerHeight(),
                maxIndex = Math.round(lastItem.position().top / height);
            this.jdom.menu_list.data('maxIndex', maxIndex);
        } else {
            this.jdom.menu_list.data('maxIndex', (maxIndex = 0));
        }

        //上一页按钮
        if (0 === curIndex) {
            this.jdom.header_menu.find('.menu_prev').addClass('disabled');
        } else {
            this.jdom.header_menu.find('.menu_prev').removeClass('disabled');
        }
        //下一页按钮
        if (curIndex >= maxIndex) {
            this.jdom.header_menu.find('.menu_next').addClass('disabled');
        } else {
            this.jdom.header_menu.find('.menu_next').removeClass('disabled');
        }

        var count = 0,
            index,
            found = false,
            firstItemWidth;
        this.jdom.menu_list.find('>li').each(function() {
            var item = $(this),
                oldIndex = index;
            index = Math.round(item.position().top / height);
            if (false === found && undefined !== oldIndex && oldIndex !== index) {
                //发现换行
                found = true;
            }
            if (undefined === firstItemWidth || true === found) {
                //每行第一个元素
                firstItemWidth = item.outerWidth();
            }
            if (curIndex === index) {
                count += item.outerWidth();
            }
        });

        //换页按钮定位
        if (0 == count || !found) {
            this.jdom.header_menu.find('.menu_prev').hide();
            this.jdom.header_menu.find('.menu_next').hide('fast');
        } else {
            var listWidth = this.jdom.menu_list.width();
            if (firstItemWidth >= listWidth) {
                count = 0;
            } else {
                count = Math.floor(Math.abs(listWidth - count));
            }
            this.jdom.header_menu.find('.menu_prev').show('fast').css('right', count);
            this.jdom.header_menu.find('.menu_next').show('fast').css('right', count);
        }
    };

    //顶级菜单活动项定位
    IndexMenu.prototype._locateTopMemuPostion = function() {
        var activeCode = this._CACHE.activeCode;
        if (activeCode && -1 == activeCode.indexOf('@$')) {
            var menus = this._getFullMenus(),
                l1Menu = menus[0],
                l1MenuCode = l1Menu.menu_code,
                item = this.jdom.menu_list.find('li[data-code=' + l1MenuCode + ']');
            if (item.size() > 0) {
                var height = item.outerHeight(),
                    index = Math.round(item.position().top / height);
                this.jdom.menu_list.css('top', -100 * index + '%').data('curIndex', index);
            }
        }
        this._changeTopMenuCtlBtnStatus();
    };

    //次级菜单活动项定位
    IndexMenu.prototype._locationSubMenuPostion = function() {
        var _this = this,
            activeCode = this._CACHE.activeCode;
        if (activeCode && -1 == activeCode.indexOf('@$')) {
            var wrap = this.jdom.broadside,
                list = this.jdom.broadside.find('>ul.menu'),
                item = this.jdom.broadside.find('li[data-code=' + activeCode + ']');
            if (item.size() > 0) {
                var relativeDistance = Math.abs(item.offset().top - list.offset().top),
                    viewHeight = this.jdom.broadside.height();
                if (viewHeight <= 0) {
                    return;
                }
                if (this._CACHE.subMenuLocationTimer) {
                    clearTimeout(this._CACHE.subMenuLocationTimer);
                }
                this._CACHE.subMenuLocationTimer = setTimeout(function() {
                    _this._CACHE.subMenuLocationTimer = null;
                    wrap.stop(true);
                    var scrollTop = wrap.scrollTop(),
                        itemHeight = item.height(),
                        minScrollTop = relativeDistance + itemHeight - viewHeight,
                        maxScrollTop = relativeDistance;
                    minScrollTop = (minScrollTop < 0) ? 0 : minScrollTop;
                    if (scrollTop < minScrollTop || scrollTop > maxScrollTop) {
                        scrollTop = relativeDistance - (viewHeight / 2);
                        scrollTop = (scrollTop < 0) ? 0 : scrollTop;
                        wrap.animate({ scrollTop: scrollTop + 'px' }, 300);
                    }
                }, 500);
            }
        }
    };

    //绑定页面事件
    IndexMenu.prototype._bindEvent = function() {
        var _this = this;
        //解决事件重复绑定问题
        if(this.hasBindEvent) return;
        this.hasBindEvent = true;
        //一级菜单上一页
        this.jdom.header_menu.on('click', '.menu_prev i', function() {
            _this._transTopMenuPagePrev();
            return false;
        });

        //一级菜单下一页
        this.jdom.header_menu.on('click', '.menu_next i', function() {
            _this._transTopMenuPageNext();
            return false;
        });

        //切换一级菜单
        this.jdom.header_menu.on('click', '.menu_list li.menu_item', function() {
            _this._changeTopMenuItem(this);
            if ($.isFunction(_this.events.clickTopMenu)) {
                _this.events.clickTopMenu($(this).dataString('code'));
            }
            return false;
        });

        //切换左侧菜单组
        this.jdom.broadside.on('click', '.menu li:not(.menu_item)', function() {
            _this._changeSideMenuGroup(this);
            return false;
        });

        //切换左侧菜单项
        this.jdom.broadside.on('click', '.menu li.menu_item', function() {
            _this._changeSideMenuItem(this);
            return false;
        });
    };

    module.exports = IndexMenu;
})