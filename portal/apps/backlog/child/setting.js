define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Observer = require('observer'),
        TransferPop = require('../../../../public/transferPop/TransferPop');

    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';
    //服务网关地址
    var service = {
        QUERY_BACKLOGS: SERVICE_GATEWAY + 'epframe.epbos_backlogManageService.queryBacklogs',
        QUERY_USER_BACKLOGS: SERVICE_GATEWAY + 'epframe.epbos_backlogManageService.queryUserBacklogs',
        SAVE_USER_BACKLOGS: SERVICE_GATEWAY + 'epframe.epbos_backlogManageService.saveUserBacklogs'
    };
    var Setting = function (options) {
        this.initialize(options);
    };
    Setting.prototype = {
        initialize: function (options) {
            this.el = options.el;
        },
        render: function () {
           var _this = this;
            // 渲染transfer
            this.transferPop = new TransferPop({                
                el: this.el,
                key: 'backlog_code',
                text: '{backlog_name}',
                alias : 'backlog_alias',
                remark: 'app_name',//用于显示不可编辑的项，纯展示使用
                title: ['未选待办', '已选待办'],
                align: 'center',
                isPop: true               
            })
            this.transferPop.render();
            this._loadData();

        },
        dispose: function () {
        },
        refresh: function () {
        }
    };
    Setting.prototype._loadData = function() {
        var _this = this;
        $.jsonRPC.request(service.QUERY_USER_BACKLOGS, {
            params: {
                params: { }
            },
            success: function(response) {
                var data = response.data;
                //设置选中值
                _this.transferPop.setValue(data, 'backlog_code');
                //先设值，再加载Transfer数据，避免右框无值的情况发生
                $.jsonRPC.request(service.QUERY_BACKLOGS, {
                    params: {
                        params: {}
                    },
                    success: function(response) {
                        var data = response.data;
                        _this.transferPop.load(data);
                    }
                });
            }
        });
    };
    Setting.prototype.save = function(cb) {
        var _this = this;
        var codeList = this.transferPop.getValue();
         $.jsonRPC.request(service.SAVE_USER_BACKLOGS, {
            params: {
                params: {
                    userBacklogs :  codeList
                }
            },
            success: function(response) {
                var data = response.data;
                console.log("任务待办设置保存成功！！！！");
                //此时通知待办组件布局刷新列表
                Observer.trigger('backlogSetting:change', codeList);
                cb && cb();
            }
        }); 
    }
    module.exports = Setting;
});
