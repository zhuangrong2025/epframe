define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        XyzTab = require('xyz-tab'),
        mainTpl = require('./template/UserTab.html'),
        ESYS = require('../../../public/common/ESYS');
    
    var UserTab = function (options) {
        this.initialize(options);
    };

    UserTab.prototype = { // 模块原生方法
        // 初始化方法，用于缓存外部传递的参数
        initialize: function(options) {
            this.el = $(options.el); // el为外部给的dom选择器，例如："#main", ".main"等
            //加载数据字典
            this.user_code = options.user_code;
            this.user_group = options.user_group;
            this.dep_id = options.dep_id;
            this.user_status = options.user_status;
            this.userRoleControl = options.userRoleControl;
        },
        // 渲染方法，当外部需要加载模块时调用
        render: function() {
            this.el.html(mainTpl);
            this._createTabTag();
        },
        // 销毁模块方法，一般是删除模块的所有dom内容，以及删除所有相关的observer事件
        dispose: function() {
        },
        // 模块刷新方法
        refresh: function() {}
    };

    UserTab.prototype._createTabTag = function() {
        var that = this;
        // 切换tab
        this.tabTag = new XyzTab({
            el : '#user_tab',
            config : [ {
                id : 'tab1',
                title : '用户信息',
                child : {
                    path : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/child/UserInfo'),
                    options : {
                        user_code: that.user_code,
                        user_status: that.user_status
                    },
                    refresh : false
                }
            }, {
                id : 'tab2',
                title : '用户授权',
                child : {
                    path : ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/child/RoleRight'),
                    options : {
                        user_code: that.user_code,
                        user_group: that.user_group,
                        dep_id: that.dep_id,
                        user_status: that.user_status,
                        userRoleControl: that.userRoleControl
                    },
                    refresh : false
                }
            }]
        });
        this.tabTag.render();
    }

    module.exports = UserTab;
})