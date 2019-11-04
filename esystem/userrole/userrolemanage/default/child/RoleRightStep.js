define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        XyzAlert = require('xyz-alert'),
        ESYS = require('../../../../../public/common/ESYS');
        ESYS.require('rolerightselect');

    require('xyz-jsonRPC')($);

    var tpl = require('./template/RoleRightStep.html');
    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        MENU_LIST: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.queryMenusByAppId',
        SAVE_USER_ROLE: SERVICE_GATEWAY + 'epframe.epbos_userRoleService.saveUserRoleRight'
    };
    var RoleRightStep = function(options) {
        this.initialize(options);
    };

    RoleRightStep.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.ctx = options.ctx;
        },
        render: function() {
            $(this.el).html(tpl);
            this._createSelector();
            this._bindEvent();
        },
        dispose: function() {},
        refresh: function() {}
    };
    RoleRightStep.prototype._createSelector = function() {
        var _this = this;
        //this._refreshDepId(); //解决步骤条初始化时获取_m.getInstanceById(id)为undefined的问题
        this.menuSelect = new ESYS.rolerightselect({
            el: '#role_right_container',
            dep_id: _this.dep_id,
            url: service.MENU_LIST
        });
        this.menuSelect.render();
    };

    RoleRightStep.prototype._bindEvent = function(){
        var _this = this;
        //取消
        $("#roleAddCancel").click(function() {
            _this._exit();
        });

        //保存
        $("#roleAddSave").click(function() {
            _this._saveRoleAuthority();
        });

        //为角色授权
        $('#openRelation').on('click', function(){
            _this._exit();
            var optData = {
                userRoleId: _this.userRoleId,
                suitDeptIds: _this.suitDeptIds,
                suitDeptItems: _this.suitDeptItems
            }
            Observer.trigger('UserRole:openrelation', optData); //通知父级页面信息更新成功,打开开启权限弹层
        });
    };

    RoleRightStep.prototype._saveRoleAuthority = function(){
        var _this = this,
            data = this.menuSelect.getData();
        if(this.processing === true) {//防止重复提交
            return;
        }
        this.processing = true; //处理中
        //保存
        $.jsonRPC.request(service.SAVE_USER_ROLE, {
            params: {
                params: {
                    role_id: this.userRoleId,
                    rights: data
                }
            },
            success: function(response) {
                $('#operationSuccessLayer').show();
                _this.processing = false;
            },
            error: function(response) {
                _this.processing = false;
                XyzAlert.error('系统提示：' + (response.message ? response.message : (response.desc ? +response.desc : '开启权限失败！')));
                window.console && console.log('开启权限失败', response);
            }
        });
    };

    RoleRightStep.prototype._exit = function(){
        var cov = window.XyzCoverlap && window.XyzCoverlap.roleAuthority;
        cov && cov.dispose();
    }

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