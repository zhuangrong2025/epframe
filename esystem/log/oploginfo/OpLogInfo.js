define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        shineForm = require('shine-form'),
        baseCommon = require('base-common-module'),
        XyzTreeselect = require('xyz-treeselect'),
        XyzSelect2 = require('xyz-select2'),
        DateUtils = require('../../../public/lib/date-utils'),
        ESYS = require('../../../public/common/ESYS');
    ESYS.require('datalist', 'tab', 'dialog', 'daterangepicker','datatable','userselect','menuselect')
    var PermissionControl = require('../../../public/permissioncontrol/PermissionControl');

    require('xyz-jsonRPC')($);

    //模板引入
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
            GET_LOG_LIST: getTableURL('epframe.epbos_systemInfoService.queryLogs'),
            GET_MENU_LIST: getJsonURL('epframe.epbos_userRoleService.queryMenusByAppId')
        }
    }();
    var OpLogInfo = function(options) {
        this.initialize(options);
    };

    OpLogInfo.prototype = {
        initialize: function(options) {
            this.el = options.el;
        },
        render: function() {
            //登录用户是否有访问权限
            var permission = new PermissionControl({
                userGroup: ['1']
            });
            if(!permission.allow()){
                return false;    //无权限不允许继续访问
            }
            $(this.el).html(mainTpl);
            this.appID = baseCommon.getContext().app_id;
            this.form = $('#queryForm');
            this._renderDatePicker();
            this._renderUserSelect();
            this._renderMenuSelect();
            this._renderResultSelect();
            this._renderLogTable();
            ESYS.ap.process('condition');
            this._bindEvent();
            $("[data-toggle='popover']").popover(); 
        },
        dispose: function() {},
        refresh: function() {
            this.dispose();
            this.render()
        }
    };

    OpLogInfo.prototype._renderUserSelect = function() {
        this.userselect = new ESYS.userselect({
            el: "#userselect",
            name: 'user_codes'
        });
        this.userselect.render();
    };
    OpLogInfo.prototype._renderMenuSelect = function() {
        this.menuselect = new ESYS.menuselect({
            el: "#menuselect",
            name: 'menu_codes'
        });
        this.menuselect.render();
    };

    OpLogInfo.prototype._renderDatePicker = function() {
        var _this = this;
        this.datepicker = new ESYS.daterangepicker({
            el: '#datepicker',
            startKey: 'start_op_date',
            endKey: 'end_op_date',
            tabs: true
        });
        this.datepicker.render();
    };
    //渲染操作结果下拉选择框
    OpLogInfo.prototype._renderResultSelect = function(){
        this.resultSelect = new XyzSelect2({
            el: '#resultSelect',
            name: 'ret_code',
            ajax : {
                list: [
                    {'ret_code': '','ret_name': ''},
                    {'ret_code': 0,'ret_name': '成功'},
                    {'ret_code': -1,'ret_name': '失败'}
                ],
                url : '',
                id: "ret_code",    //配置存储的id名称
                text: "ret_name",    //配置显示的内容字段
                params:{},    //参数
            }
        });
        this.resultSelect.render();
    };

    //渲染日志列表
    OpLogInfo.prototype._renderLogTable = function() {
        var _this = this;
       // var period = DateUtils.getWeekPeriod();
        var  currDate = new Date();//初始化，默认当天数据 ,与 this.datepicker 初始化的时间一致
        this.logTable = new ESYS.datatable({
            el: '#logTable',
            id: 'logTable',
            url: service.GET_LOG_LIST,
            params: {
               params: {
                    start_op_date: DateUtils.date2str(currDate, 'y-m-d'),
                    end_op_date:  DateUtils.date2str(currDate, 'y-m-d')
                } 
            },
            checkbox: false,
            columns: [
                {
                    field: 'user_code',
                    title: '用户代码'
                },
                {
                    field: 'user_code',
                    title: '操作员姓名',
                    dict : true
                }, {
                    field: 'dep_id',
                    title: '所属部门',
                    dict : true
                },
                {
                    field: 'menu_name',
                    title: '功能',
                },
                {
                    field: 'op_date',
                    title: '操作时间'
                },
                {
                    field: 'op_type_ext',
                    title: '操作类型'
                },
                {
                    field: 'ret_desc',
                    title: '操作结果',
                    tpl: ' {this.showDetail(item)}'
                },
                {
                    field: 'op_desc',
                    title: '操作内容'
                },
                {
                    field: 'op_ip',
                    title: 'IP地址'
                }
            ]
        }, this);
        this.logTable.render();
    };

    OpLogInfo.prototype.showDetail = function(item) {
        var _this = this;
        var html = '';
        if(item.ret_code == -1){
           html = '<a href="javascript:void(0)" data-content="{item.ret_desc}" data-trigger="manual" data-toggle="popover" data-container="body" data-placement="right" data-title="失败信息">处理失败</a>';
        }else{
           html = ''+item.ret_desc;
        }
        return html;
    }

    OpLogInfo.prototype._bindEvent = function() {
        var _this = this;

        //查询按钮
        $('#query_btn').on('click', function(e) {
            var params = shineForm.getValue(_this.form);
            //var dateParam = _this.datepicker.getValue();
            //_.assign(params, dateParam);
            _.assign(params, { 
                user_codes: ((params.user_codes) || []).join(','),
                menu_codes: ((params.menu_codes) || []).join(',')
            });
            _this.logTable.setParams(params);
            _this.logTable.reload();
        });

    }
    module.exports = OpLogInfo;
});