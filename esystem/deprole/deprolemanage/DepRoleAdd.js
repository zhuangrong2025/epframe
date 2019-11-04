define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        ESYS = require('../../../public/common/ESYS');
    ESYS.require('step');

    //模板引入
    var mainTpl = require('./template/DepRoleAdd.html');

    var DepRoleAdd = function (options) {
        this.initialize(options);
    };
    DepRoleAdd.prototype = {
        initialize: function (options) {
            this.el = options.el;
            //this.dep_id = options.dep_id;
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
    DepRoleAdd.prototype._renderStep = function() {
        this.step = new ESYS.step({
            el: '#dep_role_step',
            url: '/EPSERVICERUN/json/USAccess/json.do?service=epframe.epbos_deptRoleService.saveDepRoleUnited',//保存地址,
            //buttons: ['cancel', 'prev', {type: 'presave', title: '保存并退出', scope: [0, 1]}, 'next', 'save'],
            buttons: ['cancel', 'prev', {type: 'presave', title: '保存并退出', scope: [0, 1]}, 'next', 'save'],
            items: [{
                name : 'role',
                title: '基础信息',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/child/RoleInfoStep'), 
                options: { 
                    dep_id: this.dep_id
                }
            }, {
                name : 'rights',
                title: '分配权限',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/child/RoleRightStep'), 
                options: { 
                    dep_id: this.dep_id
                }
            }, {
                name : 'depts',
                title: '关联部门',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/deprole/deprolemanage/child/DepBindStep'), 
                options: {
                    dep_id: this.dep_id
                }
            }],
            events: {
                exit: function(action) {
                    var cov = window.XyzCoverlap && window.XyzCoverlap['dep_role_add_cover']; 
                    if(cov) {
                        if(action === 'save') {
                            Observer.trigger('DepRole:refresh');//通知父级页面信息更新成功
                        }
                        cov.dispose();
                    }
                }
            }
        });
        this.step.render();
        
    };
    
    module.exports = DepRoleAdd;
});