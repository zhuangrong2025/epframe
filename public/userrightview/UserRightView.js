/**
 * 部门用户穿梭选择框.
 */
define(function(require, exports, module) {
	var $ = require('jquery'),
        _ = require('lodash'),
        XyzTree = require('xyz-ztree'),
        BaseComm = require('base-common-module'),
        XyzTab = require('xyz-tab'),
        ESYS = require('../common/ESYS');

    ESYS.require('dialog', 'alert');

    var tpl = '';
    tpl += '<div app-tab></div>';
    tpl += '<div class="esys-action-grid paddingtop8">';
    tpl += '<div class="col">';
       /* 搜索 组件 */
    tpl += '<div class="esys-search">';
    tpl += '<dl>';
    tpl += '<dt>';
    tpl += '<input type="text" class="form-control search-input-btn" placeholder="输入名称搜索">';
    tpl += '<i class="fa fa-search"></i>';
    tpl += '</dt>';
    tpl += '</dl>';
    tpl += '</div>';
        /* 搜索 组件 */
    tpl += '</div>';
    tpl += '</div>';
    tpl += '<div menu-tree class="menu-tree-box view_box">';
    tpl += '</div>';

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        APP_INFO_LIST: SERVICE_GATEWAY + 'epframe.epbos_userSupportService.getAppListByUserCode',
        MENU_LIST : SERVICE_GATEWAY + 'epframe.epbos_userSupportService.getUserRightByUserCode'
    };

	var UserRightView = function(options) {
        this.initialize(options);
	};

	UserRightView.prototype = {
        settings : {},
		initialize : function(options) {
            this.el = $(options.el);
            _.assign(this.settings, options);
            this.app_list = []; //系统列表
            this.cur_app_id = 0; //当前系统Id
		},
		render : function() {
            var _this = this;
            this._initAppList();
		},
        dispose: function() {
            this.tree.dispose();
            this.appTab.dispose();
            this.tree = null;
            this.appTab = null;
            this.el.empty();
        },
        refresh: function() {
            this.dispose();
            this.render();
        }
    };

    UserRightView.prototype._createDialog = function() {
        var _this = this;
        this.dialog = new ESYS.dialog({
            data: {
                width: 450,
                height: 400,
                title: '查看权限',
                content : '<div right-view style="height:100%"></div>',
                buttons: [
                    {type: 'cancel', cls: 'btn-close', title: '关闭', handler: function(dlg) {
                        _this.dispose();
                        dlg.close();
                    }}
                ]
            }
        });
        this.dialog.render();
        
    }

    //初始化数据
    UserRightView.prototype._initAppList = function() {
        var _this = this;
        $.jsonRPC.request(service.APP_INFO_LIST, {
            params: {
                params: {
                    user_code : this.settings.user_code,
                }
            },
            success: function(response) {
                var data = response.data;
                if(!data || !data.length) {
                    ESYS.alert.info('该用户未授权!');
                    return false;
                }
                _this.app_list = data;
                _this.cur_app_id = data.length ? data[0].app_id : 0;
                _this._createElements();
            },
            error: function(response) {
                //_this._createElements();
            }
        });
    }

    UserRightView.prototype._createElements = function() {
        if(this.app_list && this.app_list.length) {
            this._createDialog();
            this.dialog.find('[right-view]').html(tpl);
            this.tabId =  _.uniqueId('app_tab');
            this.treeId =  _.uniqueId('menu_tree');
            this.dialog.find('[app-tab]').attr('id', this.tabId);
            this.dialog.find('[menu-tree]').attr('id', this.treeId);
            this._createAppTab();
            this._createMenuTree();
            this._initEvents();
        } else {
            this.dialog.find('[right-view]').html('该用户未授权');
        }
    }
    //渲染APP列表tab
    UserRightView.prototype._createAppTab = function() {
        var _this = this,
            config = [];
        _.each(this.app_list, function(app, i) {
            config.push({
                id: 'app_'+app.app_id,
                title :  app.app_name,
                active : i === 0 ? true : false
            });
        });
        this.appTab = new XyzTab({
            el : '#'.concat(this.tabId),
            view: 'line',
            config : config,
            events: {
                change : function(id, m) {
                    var app_id = id.replace('app_', '');
                    if(_this.cur_app_id === app_id) return; 
                    _this.cur_app_id = app_id;
                    _this._createMenuTree();
                }
            }
        });
        this.appTab.render();
    }
    //创建菜单树
    UserRightView.prototype._createMenuTree = function() {
        var _this = this,
            cur_app_id = this.cur_app_id;
        if(this.tree) {
            this.tree.dispose();
        }
        this.tree = new XyzTree({
            el: '#'.concat(this.treeId),
            multiple: false,
            ajax: {
                url: service.MENU_LIST,
                id: 'menu_code',
                pid: 'parent_menu_code',
                text: 'menu_name',
                params: {
                    params: {
                        user_code : this.settings.user_code,
                        app_id: cur_app_id
                    }
                }
            },
            formatData: function(data) {
                $.each(data, function(i, n) {
                    n.open = true;
                }); 
                return data;
            },
            events : {
                dataCallback : function(tree) {

                },
                click : function(data) {

                }
            }
        });
        this.tree.render();
    }

    UserRightView.prototype._initEvents = function() {
        var _this = this;
        var timeoutId = null;
        function searchMenus() {//查找筛选菜单
            if (timeoutId) { 
                clearTimeout(timeoutId);
            }
            var text = $(this).val();
            timeoutId = setTimeout(function() {
                _this.tree.filter(text);
            }, 500);
        }
        this.dialog.find(".search-input-btn").bind("propertychange", searchMenus)
            .bind("input", searchMenus);
    }

	module.exports = UserRightView;
});