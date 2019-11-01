define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        xyzAlert = require('xyz-alert'),
        XyzTopMenuPage = require('xyz-right-top-menu-page'),
        utils = require('../public/lib/utils');
require('font-Awesome');
    //模板引入
    //var applicationTpl = require('./template/IndexApplication.html');
    var applicationTpl = '<img src="../../assets/business/index/shine_logo_97.png" />  ' +
        '<span class="app_name"><%=appInfo.app_name%></span>';
    swtichBarTpl = '<div class="index_header_switch">' +
        '<span class="app_switch_label">运维系统</span><i class="xy-icon xy-access_system"></i>' +
        '</div>';

    function IndexApplication(options) {
        this.initialize(options);
    };

    IndexApplication.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            this.jdom = {};
            this._CACHE = {};
            var appContext = options.app || {};
            this.appList = appContext.list || [];
            this.curAppId = appContext.cur_app_id;
            this.allowSwitch = appContext.allowSwitch;
            this.curAppInfo = null;
            /* var _curIndex = _.findIndex(this.appList, function(app) {
                return app.app_id === this.curAppId;
            }, this);
            this.curAppInfo = this.appList[_curIndex]; */
            this.otherAppList = [];
            _.each(this.appList, function(app, i) {
                if (app.app_id === this.curAppId) {
                    this.curAppInfo = app;
                } else {
                    app.is_valid === '1' && this.otherAppList.push(app);
                }
            }, this);
            this.events = $.extend({
                changeApplication: function(appId) {},
                closeSwitch: function() {}
            }, options.events);
        },
        render: function() {
            this.el.find('.app_title').html(utils.tmpl(applicationTpl, { appInfo: this.curAppInfo }));
            if (this.allowSwitch) {
                this.$switchBar = $(swtichBarTpl);
                this.el.append(this.$switchBar);
                //window.location.href
                this.el.addClass('has_switch');
            }
            this._init();
            return this;
        }
    };

    //初始化
    IndexApplication.prototype._init = function() {
        this._bindEvent();
    };
    //切换系统
    IndexApplication.prototype._switchApp = function(appId) {
        this.events.changeApplication(appId);
        this.curAppId = appId;
        this.otherAppList = [];
        _.each(this.appList, function(app, i) {
            if (app.app_id == appId) {
                this.curAppInfo = app;
            } else {
                app.is_valid === '1' && this.otherAppList.push(app);
            }
        }, this);
        this.render();
    };

    IndexApplication.prototype._showAppMenu = function(apps, callback) {
        if (!this.topMenuPage) {
            var _this = this,
                items = [];
			var url = window.location.href,
				path = window.location.pathname,
				webApp = path.split('/')[1];
            _.each(this.otherAppList, function(app) {
                var app_url = app.app_url || '',
                    app_path = app.app_path || 'EPWEBRUN',
                    app_type = app.app_type || '0';
                if(app_type === '1') {//旧系统
                    url = [app_url, app_path].join('/');
                } else if(app_type === '0') {//新系统
					url = [app_url, app_path, 'index.html'].join('/');
					url += '?app_id=' + app.app_id;
                } else {
                    url = [app_url, app_path].join('/');
                }
                items.push({
                    name: app.app_name,
                    url: url
                })
            }, this);
            this.topMenuPage = new XyzTopMenuPage({
                el: "body",
                title: '运维系统',
                data: items,
                events: {
                    close: function(url) {
                        _this.events.closeSwitch(url);
                    }
                }

            });
            this.topMenuPage.render();
            $('#' + this.topMenuPage.id).attr('subsys_nav', 'true');
        }
        this.topMenuPage.showRightMenu();
    };

    //----------------------- 开放接口 - start

    //设置用户数据
    IndexApplication.prototype.setUserData = function(userData) {
        this._CACHE.USER = userData;
    };

    //----------------------- 开放接口 - end

    //绑定页面事件
    IndexApplication.prototype._bindEvent = function() {
        var _this = this;
        /* this.el.find('.dropdown>li').unbind('click').bind('click', function() {
            var appId = $(this).attr('data-id');
            _this._switchApp(appId);
        }); */
        var isIn = false;
        if (this.allowSwitch) {
            /*  this.$switchBar.mouseenter(function() {
                 isIn = true;
                 window.setTimeout(function() {
                     if(isIn === true) {
                         _this._showAppMenu();
                     }
                 }, 500);
             });
             this.$switchBar.mouseleave(function() {
                 isIn = false;
             });  */
            this.$switchBar.unbind('click').bind('click', function() {
                _this._showAppMenu();
            });
        }
    };

    module.exports = IndexApplication;
});
