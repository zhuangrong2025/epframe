define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        ESYS = require('../../../../public/common/ESYS'),
        tpl = require('./template/UserRoleView.html');
    ESYS.require('tab');

    var UserRoleView = function(options) {
        this.initialize(options);
    };
    UserRoleView.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.role = options.role;
        },
        render: function() {
            $(this.el).html(tpl);
            this._renderTab();
        },
        dispose: function() {},
        refresh: function() {}
    };

    //创建步骤面板
    UserRoleView.prototype._renderTab = function() {
        this.tab = new ESYS.tab({
            el: '#user_role_tab',
            config: [{
                id: 'tab1',
                title: '角色信息',
                child: {
                    path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/RoleInfoTab'),
                    options: {
                        role: this.role
                    },
                    refresh: false
                }
            }, {
                id: 'tab2',
                title: '功能权限',
                child: {
                    path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/RoleRightTab'),
                    options: {
                        role_id: this.role.role_id,
                        dep_id: this.role.dep_id
                    },
                    refresh: false
                }
            }, {
                id: 'tab3',
                title: '已关联用户',
                child: {
                    path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/UserBindTab'),
                    options: {
                        role: this.role
                    },
                    refresh: false
                }
            }]
        });
        this.tab.render();

    };

    module.exports = UserRoleView;
});