define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        ESYS = require('../../../../public/common/ESYS');
        ESYS.require('step');

    //模板引入
    var mainTpl = require('./template/UserRoleAdd.html');

    var UserRoleAdd = function (options) {
        this.initialize(options);
    };
    UserRoleAdd.prototype = {
        initialize: function (options) {
            this.el = options.el;
            this.dep_id = options.dep_id;
        },
        render: function () {
            $(this.el).html(mainTpl);
            this._renderStep();
        },
        dispose: function () {
        },
        refresh: function () {
        }
    };


    
    
    //创建步骤面板
    UserRoleAdd.prototype._renderStep = function() {
        this.step = new ESYS.step({
            url: '/EPSERVICERUN/json/USAccess/json.do?service=epframe.epbos_userRoleService.saveUserRoleUnited',//保存地址
            el: '#user_role_step',
            buttons: ['cancel', 'prev', {type: 'presave', scope: [0, 1, 2]}, 'next', 'save'],
            items: [{
                name : 'role',
                title: '角色信息',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/RoleInfoStep'), 
                options: { 
                    dep_id: this.dep_id
                }
            }, {
                id: 'step-rights',
                name:'rights',
                title: '开启权限',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/RoleRightStep'), 
                options: { 
                    dep_id: this.dep_id
                }
            }, {
                id: 'step-users',
                name : 'users',
                title: '关联用户',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/userrole/userrolemanage/default/child/UserBindStep'), 
                options: {
                    dep_id: this.dep_id
                }
            }],
            events: {
                exit: function(action) {
                    var cov = window.XyzCoverlap && window.XyzCoverlap['role_add_cover']; 
                    if(cov) {
                        if(action === 'save') {
                            Observer.trigger('UserRole:refresh');//通知父级页面信息更新成功
                        }
                        cov.dispose();
                    }
                },
                change: function(id, status, finish, _m){
                    if('step-users' == id){
                        var module = _m.getInstanceById(id);
                        module && module.load && module.load();
                    }
                    if('step-rights' == id){
                        var module = _m.getInstanceById(id);
                        module && module._refreshDepId && module._refreshDepId();
                    }

                }
            }
        });
        this.step.render();
        
    };
    
    module.exports = UserRoleAdd;
});