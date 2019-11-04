define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash');
        baseCommon = require('base-common-module');
        XyzAlert = require('xyz-alert');
        XyzDatepicker = require('xyz-datepicker');
        XyzTimepicker = require('xyz-timepicker');

        ESYS = require('../../../../public/common/ESYS');
     //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service='; 
    //服务网关地址
    var service = {
        ADD_USER_NOTE: SERVICE_GATEWAY + 'epframe.epbos_notesManageService.addUserNote' 
    };
    //模板引入
    var mainTpl = require('./template/main.html');

    var Add = function (options) {
        this.initialize(options);
    };
    Add.prototype = {
        initialize: function (options) {
            this.el = options.el;
        },
        render: function () {
          $(this.el).html(mainTpl);
           //创建处理时间
          this._createProcessDate();
          this.processDate.setValue(new Date(),'YYYY-MM-DD');
          this._createProcessTime();
          this.processTime.setValue('08:00');
        },
        dispose: function () {
        },
        refresh: function () {
        }
    };
    Add.prototype._createProcessDate = function(){
        this.processDate = new XyzDatepicker({
              el: "#process_date_content",
              name: 'date',
              required: true
        });
        this.processDate.render();
    };
    Add.prototype._createProcessTime = function(){
        this.processTime = new XyzTimepicker({
              el: "#process_time_content", 
              required: true
        });
        this.processTime.render();
    };
    /*
     * 保存数据, dialog组件会调用该方法. 
     * cb为回调函数，保存成功后调用cb关闭对话框.
     */
    Add.prototype.save = function(cb) {
        var content = $('#content').val(); 
        var process_time = this.processDate.getValue()+" " +this.processTime.getValue()+":00"; 
        var remind = $('#remind').val();
        //时间运算
        var date = new Date(process_time.replace(/-/g, '/'));
        var dateTime = date.getTime();
        date.setTime( dateTime - 1000*60*remind );
        var remind_time = this.formatDate(date) ;
        //console.log(process_time); 
        //console.log(remind_time); 
        if( content=='' ){
           XyzAlert.warning("系统提示：便签内容不能为空！");
           return;
        } 
        $.jsonRPC.request(service.ADD_USER_NOTE, {
            params: {
                params: {
                    content: content,
                    process_time: process_time,
                    remind_time:remind_time
                }
            },
            success: function(response) {
               // XyzAlert.info('添加成功！');
                cb && cb();
            }
        });               
       
    };
    /*
     *时间类型转为 yyyy-MM-dd HH:mm:ss 格式的字符串
     */
   Add.prototype.formatDate = function (date) {  
        var y = date.getFullYear();  
        var m = date.getMonth() + 1;  
        m = m < 10 ? ('0' + m) : m;  
        var d = date.getDate();  
        d = d < 10 ? ('0' + d) : d;  
        var h = date.getHours();  
        h = h < 10 ? ('0' + h) : h; 
        var minute = date.getMinutes();  
        minute = minute < 10 ? ('0' + minute) : minute; 
        var second= date.getSeconds();  
        second = minute < 10 ? ('0' + second) : second;  
        return y + '-' + m + '-' + d+' '+h+':'+minute+':'+ second;  
    };
    module.exports = Add;
});
