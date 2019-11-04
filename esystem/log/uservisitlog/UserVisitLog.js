define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        shineForm = require('shine-form'),
        baseCommon = require('base-common-module'),
        DateUtils = require('../../../public/lib/date-utils'),
        ESYS = require('../../../public/common/ESYS');
    ESYS.require('datalist', 'tab', 'dialog', 'daterangepicker','datatable','userselect');
    var PermissionControl = require('../../../public/permissioncontrol/PermissionControl');

    require('xyz-jsonRPC')($);


    var mainTpl = require('./template/main.html');
    var service = function() {
        var JSON_BASE = '/EPSERVICERUN/json/USAccess/json.do?service=',
            TABLE_BASE = '/EPSERVICERUN/table/USAccess/dataTables.do?service=';

        function getJsonURL(servUrl) {
            return JSON_BASE + servUrl;
        }

        function getTableURL(servUrl) {
            return TABLE_BASE + servUrl;
        }
        return {
            GET_LOGIN_OUT_LOG: getTableURL('epframe.epbos_userVisitLogService.queryUserVisitLog'), //获取登录登出日志
        }
    }();

    var UserVisitLog = function(options) { // 不用去动，spm自动生成。
        this.initialize(options);
    };

    UserVisitLog.prototype = { // 模块原生方法
        // 初始化方法，用于缓存外部传递的参数
        initialize: function(options) {
            this.el = $(options.el); // el为外部给的dom选择器，例如："#main", ".main"等
        },
        // 渲染方法，当外部需要加载模块时调用
        render: function() {//登录用户是否有访问权限
            var permission = new PermissionControl({
                userGroup: ['1']
            });
            if(!permission.allow()){
                return false;    //无权限不允许继续访问
            }
            this.el.html(mainTpl);
            this.form = $('#queryForm');
            this._createLogForm();
            ESYS.ap.process('condition');
            this._bindEvent();
        },
        // 销毁模块方法，一般是删除模块的所有dom内容，以及删除所有相关的observer事件
        dispose: function() {

        },
        // 模块刷新方法
        refresh: function() {}
    };
    //创建查询表单
    UserVisitLog.prototype._createLogForm = function() {
        this._renderDatePicker();
        this._renderUserSelect();
        this._renderLogTable();
    };
    UserVisitLog.prototype._renderUserSelect = function() {
        this.userselect = new ESYS.userselect({
            el: "#userselect",
            name: 'user_codes'
        });
        this.userselect.render();
    };

    UserVisitLog.prototype._renderDatePicker = function() {
        var _this = this;
        this.datepicker = new ESYS.daterangepicker({
            el: '#datepicker',
            startKey: 's_login_date',
            endKey: 'e_login_date',
            tabs: true
        });
        this.datepicker.render();
    };
    //渲染日志列表
    UserVisitLog.prototype._renderLogTable = function() {
        var _this = this;
        //var period = DateUtils.getWeekPeriod();
        var  currDate = new Date();//初始化，默认当天数据 与 this.datepicker 初始化的时间一致
        this.visitLogTable = new ESYS.datatable({
            el: '#logTable',
            id: 'logTable',
            url: service.GET_LOGIN_OUT_LOG,
            params: {
                params: {
                    s_login_date: DateUtils.date2str(currDate, 'y-m-d'),
                    e_login_date: DateUtils.date2str(currDate, 'y-m-d')
                }
            },
            checkbox: false,
            columns: [{
                    title: "操作员",
                    field: "user_code"
                },
                {
                    title: "IP地址",
                    field: "ip"
                },
                {
                    title: "登录时间",
                    field: "login_date"
                },
                {
                    title: "登出时间",
                    field: "logout_date"
                }
            ]
        }, this);
        this.visitLogTable.render();
    };

    UserVisitLog.prototype._bindEvent = function() {
        var _this = this;

        //查询按钮
        $('#query_btn').on('click', function(e) {
            var params = shineForm.getValue(_this.form);
            _.assign(params, { user_codes: ((params.user_codes) || []).join(',') });
            _this.visitLogTable.setParams(params);
            _this.visitLogTable.reload();
        });

    };
    module.exports = UserVisitLog;
});