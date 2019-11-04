define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        XyzAlert = require('xyz-alert'),
        ESYS = require('../../../../../public/common/ESYS');
        ESYS.require('rolerightselect');

    require('xyz-jsonRPC')($);

    var tpl = require('./template/RoleRightStep.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        MENU_LIST: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryMenusByAppId'
    };
    var RoleRightStep = function(options) {
        this.initialize(options);
    };

    RoleRightStep.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.ctx = options.ctx;
            this.dep_id = "";
        },
        render: function() {
            $(this.el).html(tpl);
            this._createSelector();
            //this._bindEvent();
        },
        dispose: function() {},
        refresh: function() {}
    };
    RoleRightStep.prototype._refreshDepId = function() {
        var dep_id = this.ctx.getStepData(0).role.dep_id; //取第一步的数据
        if (dep_id !== this.dep_id) {
            this.dep_id = dep_id;
            this.menuSelect && this.menuSelect.refresh({
                dep_id: this.dep_id
            });
        }
    };
    RoleRightStep.prototype._createSelector = function() {
        var _this = this;
        this._refreshDepId(); //解决步骤条初始化时获取_m.getInstanceById(id)为undefined的问题
        this.menuSelect = new ESYS.rolerightselect({
            el: '#role_right_container',
            dep_id: _this.dep_id,
            url: service.MENU_LIST
        });
        this.menuSelect.render();
    };

    /**
     * 以下方法是步骤条实例必须实现的方法, 保证步骤的正常操作.
     */
    //获取数据
    RoleRightStep.prototype.getData = function() {
        return this.menuSelect.getData();
    };
    //检验是否允许切换到下一步
    RoleRightStep.prototype.checkChange = function() {
        var data = this.menuSelect.getData();
        var isNext = false;
        $.each(data, function(idx, obj) {
            if (obj.length > 0) {
                isNext = true;
                return;
            }
        });
        if (!isNext) {
            XyzAlert.info('请关联系统权限！');
        }
        return isNext;
    };

    module.exports = RoleRightStep;
});