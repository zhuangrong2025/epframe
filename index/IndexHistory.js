define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        storage = require('xyz-storage');

    //全局常量
    var MAX_HISTORIC_MENU_SIZE = 3,
        HISTORIC_VALID_DURATION = 40320;

    function IndexHistory(options) {
        this.initialize(options);
    };

    IndexHistory.prototype = {
        initialize: function(options) {
            this._CACHE = {};
            this.historicMenuKey = '';
            this.events = $.extend({
                openMenu: function(menuCode) {}
            }, options.events);
        },
        render: function() {
            return this;
        }
    };

    //-----------------------

    //设置菜单数据
    IndexHistory.prototype.setMenuData = function(menuData) {
        this._CACHE.MENU = menuData;
    };

    //设置关键字
    IndexHistory.prototype.setHistoricMenuKey = function(historicMenuKey) {
        this.historicMenuKey = historicMenuKey;
    };

    //是否有效菜单
    IndexHistory.prototype._isValidHistoricMenu = function(menuInfo) {
        if (null != menuInfo && 0 != $.trim(menuInfo.deploy_name).length && 0 != $.trim(menuInfo.func_path).length) {
            return true;
        }
        return false;
    };

    //打开最近有效历史菜单
    IndexHistory.prototype.openLastHistoricMenu = function() {
        var historicMenus = storage.getLocalItem(this.historicMenuKey),
            menuCode, menuInfo;
        if ($.isArray(historicMenus) && historicMenus.length > 0) {
            for (var i = historicMenus.length - 1; i >= 0; i--) {
                menuCode = historicMenus[i];
                menuInfo = this._CACHE.MENU.hashMap[menuCode];
                if (this._isValidHistoricMenu(menuInfo)) {
                    break;
                }
            }
        }
        if (undefined === menuCode && this._CACHE.MENU.menuArr.length > 0) {
            var fullMenus = this._getFullMenus(this._CACHE.MENU.menuArr[0]);
            /* var l2Arr = this._CACHE.MENU.menuArr[0].childArr;
            if (l2Arr.length > 0) {
                var l3Arr = l2Arr[0].childArr;
                if (l3Arr.length > 0) {
                    menuCode = l3Arr[0].menu_code;
                }
            } */
            menuCode = fullMenus[0].menu_code;
        }
        var menuInfo = this._CACHE.MENU.hashMap[menuCode];
        if (this._isValidHistoricMenu(menuInfo) && $.isFunction(this.events.openMenu)) {
            this.events.openMenu(menuCode);
        }
    };

    //获取当前菜单的完整菜单路径
    IndexHistory.prototype._getFullMenus = function(topMenu) {
        
        function putFirstChild(menu) {
            if(menu.childArr && menu.childArr.length) {
                menus.push(menu.childArr[0]);
                putFirstChild(menu.childArr[0]);
            }
        }
        var menus = [topMenu];
        putFirstChild(topMenu);
        //反转数组，末级置于前
        menus = _(menus).reverse().value();
        return menus;
    }

    //记录最近历史菜单
    IndexHistory.prototype.recordLastHistoricMenu = function(menuCode) {
        var historicMenus = storage.getLocalItem(this.historicMenuKey),
            size;
        if (!$.isArray(historicMenus)) {
            historicMenus = [];
        }
        size = historicMenus.length;
        if (size > 0 && menuCode == historicMenus[size - 1]) {
            //上次菜单相同则忽略，但更新缓存时间
            storage.setLocalItem(this.historicMenuKey, historicMenus, HISTORIC_VALID_DURATION);
            return;
        }
        if (size >= MAX_HISTORIC_MENU_SIZE) {
            historicMenus.shift();
        }
        historicMenus.push(menuCode);
        storage.setLocalItem(this.historicMenuKey, historicMenus, HISTORIC_VALID_DURATION);
    };

    //-----------------------

    module.exports = IndexHistory;
});