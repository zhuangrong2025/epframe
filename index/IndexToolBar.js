define(function(require, exports, module) {
    var $ = require('jquery'),
        xyzAlert = require('xyz-alert'),
        IndexMessage = require('./IndexMessage'),
        IndexSetting = require('./IndexSetting'),
        ESYS = require('../public/common/ESYS');
        ESYS.require('dialog');

    //模板引入
    var indexToolBarTpl = require('./template/IndexToolBar.html');
    var simpleTpl = '<ul class="tool_list">' +
                    '  <li class="favorite" id="header_favorite">' +
                    '    <a href="javascript:void(0)">' +
                    '      <i class="fa fa-star-o"></i>' +
                    '      <i class="fa fa-star favShow"></i>' +
                    '    </a>' +
                    '  </li>' +
                    '  </ul>';

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        SAVE_USER_THTME: SERVICE_GATEWAY + 'epframe.epbos_themeStyleService.saveThemeStyle'
    };

    function IndexToolBar(options) {
        this.initialize(options);
    };

    IndexToolBar.prototype = {
        initialize: function(options) {
            this.isContainer = options.isContainer;
            this.el = $(options.el);
            this.jdom = {};
            this._CACHE = {};
            this.userInfo;
            this.themeLock = false;
            this.main = options.main; //首页主模块
            this.events = $.extend({
                openCustomedTab: function(tabCode, tabName, tabUrl) {},
                openMenuTab: function(menuCode) {},
                changeTheme: function(theme) {}
            }, options.events);
        },
        render: function() {
            if(this.isContainer) {
                this.el.html(indexToolBarTpl);
                this._init();
            } else {
                this.el.html(simpleTpl);
            }
            this._bindEvent();
            return this;
        }
    };

    //初始化
    IndexToolBar.prototype._init = function() {
        //create indexMessage
        this.indexMessage = new IndexMessage({}).render();

    };

    //----------------------- 开放接口 - start

    //设置用户数据
    IndexToolBar.prototype.setUserData = function(userData) {
        this._CACHE.USER = userData;
        this.userInfo = this._CACHE.USER.user;
        this.isContainer && this._renderUserInfo();
        this._changeTheme(this.userInfo.user_theme, false);
        //创建indexSetting实例，获取最新的主题名称--子模块和父模块直接的相互通信；获取theme在setUserData后
        this.indexSetting = new IndexSetting({main: this, theme: this.userInfo.user_theme}).render();
    };

    //----------------------- 开放接口 - end

    //渲染登录信息
    IndexToolBar.prototype._renderUserInfo = function() {
        $('#header_userName').html(this.userInfo.user_name);
    };

    //切换主题
    IndexToolBar.prototype._changeTheme = function(theme, sync) {
        var _this = this,
            iframeTheme;
        if (this.themeLock) {
            xyzAlert.info('正在处理中，请稍后..');
            return;
        }
        if ('orange' === theme) {
            iframeTheme = 'darkblue';
        } else {
            theme = 'blue';
            iframeTheme = 'blue';
        }
        if (true === sync && theme === this.userInfo.user_theme) {
            return false;
        }
        $('#indexTheme').attr('href', 'index.theme-' + theme + '.css');
        if (window.ModulesGlobal && window.ModulesGlobal.changeStyle) {
            window.ModulesGlobal.changeStyle(iframeTheme);
        } else if (window.ModulesGlobal &&
            window.ModulesGlobal.BaseCommonModule &&
            window.ModulesGlobal.BaseCommonModule.changeStyle) {
            window.ModulesGlobal.BaseCommonModule.changeStyle(iframeTheme);
        }
        if ($.isFunction(this.events.changeTheme)) {
            this.events.changeTheme(iframeTheme);
        }
        //同步
        if (true === sync) {
            this.themeLock = true;
            this.userInfo.user_theme = theme;
            $.jsonRPC.request(service.SAVE_USER_THTME, {
                params: {
                    params: {
                        user_theme: theme,
                    }
                },
                complete: function(response) {
                    _this.themeLock = false;
                },
                error: function(response) {
                    window.console && console.log('用户主题同步出错', response);
                }
            });
        }
    };

    //-----------------------

    //登出处理
    IndexToolBar.prototype._logout = function() {
        var _this = this,
            fn;
        xyzAlert.info('您确定要退出登录？', {
            showCancelButton: true,
            closeOnConfirm: false,
            closeOnCancel: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            confirm: function() {
                _this._logoutSickly();
                //window.top.location = '/EPSERVICERUN/logout?tmp=' + Math.random(10);
                /* $.ajax("/ECOMM/CommServlet?ShineService=getAllWebDeploys&tmp=" + Math.random(), {
                    type: "get",
                    dataType: "text",
                    success: function(data) {
                        var data = data.split(";"),
                            apps = [];
                        $.each(data, function(i, app) {
                            if ('' != $.trim(app) && app.indexOf('/cas') < 0 && app.indexOf('/EPSERVICERUN') < 0) {
                                apps.push(app);
                            }
                        });
                        fn = function() {
                            if (0 == apps.length) {
                                window.top.location = '/EPSERVICERUN/logout?' + Math.random(10);
                            } else {
                                _this._logoutInner(apps, fn);
                            }
                        };
                        _this._logoutInner(apps, fn);
                    }
                }); */
            }
        }, '');
    };

    IndexToolBar.prototype._logoutSickly = IndexToolBar.logout = function() {
        /* var url = '/EPSERVICERUN/logout?_=' + Math.random(10),
            send = function(apps) {
                if (0 == apps.length) {
                    window.top.location = '/EPWEBRUN/';
                } else {
                    $.getScript(apps.shift() + '?_=' + Math.random(10)).always(function() {
                        send(apps);
                    });
                }
            };
        $.getJSON(url).done(function(data) {
            if ($.isArray(data)) {
                send(data);
            }
        }).fail(function() {
            xyzAlert.error('登出出错，请刷新本页面');
        }); */
        var serviceName = window.EPWebConfig && window.EPWebConfig.SERVICE_NAME ? window.EPWebConfig.SERVICE_NAME : 'EPSERVICERUN'
        var url = '/'+ serviceName+ '/logout?_=' + Math.random(10),
            send = function(apps) {
                $.each(apps, function(i, v) {
                    $.ajax({
                        type: "GET",
                        async: false,
                        url: v,
                        dataType: "script"
                    });
                });
                window.top.location = ESYS.formaturl('/EPWEBRUN/');
            };
        $.getJSON(url).done(function(data) {
            if ($.isArray(data)) {
                send(data);
            }
        }).fail(function() {
            xyzAlert.error('登出出错，请刷新本页面');
        });
    };

    IndexToolBar.prototype._logoutInner = function(apps, callback) {
        var _this = this,
            app = apps.shift();
        $.ajax(app + "/logout?" + Math.random(10), {
            type: "get",
            dataType: "text",
            complete: function() {
                callback.call(_this);
            }
        });
    };

    //-----------------------

    //绑定页面事件
    IndexToolBar.prototype._bindEvent = function() {
        var _this = this;

        //主题切换
        this.el.find('a.theme').on('click', function() {
            var theme = 'blue';
            if ($(this).hasClass('orange')) {
                theme = 'orange';
            }
            _this._changeTheme(theme, true);
            return false;
        });

        //注销
        $('#header_logoutBtn').on('click', function() {
            _this._logout();
            return false;
        });

        //个人信息
        $('#header_gainProfileBtn').on('click', function() {
            if ($.isFunction(_this.events.openCustomedTab)) {
                _this.events.openCustomedTab('UserInfo', '个人信息', 'child/UserInfo.html');
            }
            return false;
        });

        //修改密码
        $('#header_changePasswordBtn').on('click', function() {
            if ($.isFunction(_this.events.openCustomedTab)) {
                _this.events.openCustomedTab('ChangePassword', '修改密码', 'child/ChangePassword.html');
            }
            return false;
        });
        $("#header_PortSettingBtn").on('click', function() {
            var dialog = new ESYS.dialog({
                data: {
                    width: 720,
                    title: '首页配置',
                    url: ESYS.formaturl('/EPWEBRUN/epframe/release/portal/myportal/child/PortalSetting'),
                    options: {
                        portalSetting: _this.poartalSetting,
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
                                    //菜单配置入口重新加载个人布局并渲染
                                    var iframe = $('#scene').find('iframe[data-code=\\@\\$\\@\\$MyPortal]');
                                    if(iframe.length) {
                                        iframe[0].contentWindow.reloadLayout && iframe[0].contentWindow.reloadLayout();
                                    }
                                    dlg.close();
                                }
                                inst.save && inst.save(cb);//保存
                            }
                        }
                    ]
                }
            }).render();
            return false;
        });

        //打开消息
        /* $('#header_message').on('click', function() {
            if ($.isFunction(_this.events.openMenuTab)) {
                _this.events.openMenuTab('01060203');
            }
            return false;
        }); */
        $('.favorite').on('click', 'i', function() {
            $(this).addClass('favShow').siblings().removeClass('favShow')
            if($(this).hasClass('fa-star-o'))   {
                _this.main.indexFavorite.show()
            }   else{
                _this.main.indexFavorite.close()
            }
        });


    };

    module.exports = IndexToolBar;
});
