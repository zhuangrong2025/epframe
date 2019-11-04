define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        ESYS = require('../../../public/common/ESYS');
        ESYS.require('step');

    //模板引入
    var mainTpl = require('./template/UserAdd.html');

    var service = function() {
        var JSON_BASE = '/EPSERVICERUN/json/USAccess/json.do?service=',
            TABLE_BADE = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';
        function getJsonURL(servUrl) {
            return JSON_BASE + servUrl;
        }
        function getTableURL(servUrl) {
            return TABLE_BADE + servUrl;
        }
        return {
            ROLE_LIST : getTableURL('esystem.getUserRoleInfo')
        }
    }();


    var UserAdd = function (options) {
        this.initialize(options);
    };
    UserAdd.prototype = {
        initialize: function (options) {
            this.el = options.el;
            this.step;
            this.dep_id = options.dep_id;
            this.userTable = options.userTable;
            this.userRoleControl = options.userRoleControl;
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
    UserAdd.prototype._renderStep = function() {
        var _this = this;
        if(_this.step){
            _this.step.dispose();
        }
        _this.step = new ESYS.step({
            url: '/EPSERVICERUN/json/USAccess/json.do?service=epframe.epbos_userManageService.saveUserUnified',//保存地址
            el: '#user_step',
            buttons: ['cancel', 'prev', {type: 'presave',  scope: [0]}, 'next', 'save'],
            items: [{
                name : 'user',
                title: '填写用户信息',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/child/UserInfoStep'), 
                options: { 
                    dep_id: _this.dep_id
                }
            }, {
                name : 'role_ids',
                title: '关联用户角色',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/user/usermanage/child/UserRoleStep'), 
                options: {
                    userRoleControl: _this.userRoleControl
                }
            }],
            events: {
                exit: function() {
                    var cov = window.XyzCoverlap && window.XyzCoverlap['user_add_cover']; 
                    if(cov){
                        cov.dispose();
                    }
                    _this.userTable.setParams({
                        dep_id: _this.dep_id
                    });
                    _this.userTable.reload();
                }
            }
        });
        _this.step.render();
    };
    
    module.exports = UserAdd;
});