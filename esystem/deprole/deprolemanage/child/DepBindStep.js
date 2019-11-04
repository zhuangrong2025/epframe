define(function(require, exports, module) {
    var _ = require('lodash'),
        $ = require('jquery'),
        BaseComm = require('base-common-module'),
        ESYS = require('../../../../public/common/ESYS');
    ESYS.require('deptree');
    require('xyz-jsonRPC')($);
    var tpl = require('./template/DepBindStep.html');

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        GET_DEPART_TREE: SERVICE_GATEWAY + 'epframe.epbos_departmentService.getDepInfo'
    };
    var DepBindStep = function(options) {
        this.initialize(options);
    };

    DepBindStep.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            //全局变量          
            this.userInfo = BaseComm.getUser(); //从缓存读取用户信息 
        },
        render: function() {
            this.el.html(tpl);
            this._createElements();
        },
        dispose: function() {},
        refresh: function() {}
    };
    DepBindStep.prototype._createElements = function() {
        this.depTree = new ESYS.deptree({
            el: "#depBindStepTree",
            multiple: true,
            cascade: false
        });
        this.depTree.render();
    };
    /**
     * 以下方法是步骤条实例必须实现的方法, 保证步骤的正常操作.
     */
    //获取数据
    DepBindStep.prototype.getData = function() {
        return this.depTree.getValue();
    };
    //检验是否允许切换到下一步
    DepBindStep.prototype.checkChange = function() {
        return true;
    };
    module.exports = DepBindStep;
});