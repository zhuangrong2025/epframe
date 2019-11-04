define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        format = require('objectformat'),
        Observer = require('observer'),
        Websocket = require('xyz-websocket'),
        baseCommon = require('base-common-module'),
        SwiperLite = require('../../../public/component/swiperLite/SwiperLite'),        
        ESYS = require('../../../public/common/ESYS');
        
        ESYS.require( 'dialog', 'swiperlite');

        // backlog样式
        require('./backlog.css')
            //服务网关前缀
        var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

        //服务网关地址
        var service = {
            QUERY_USER_BACKLOG_MSG: SERVICE_GATEWAY + 'epframe.epbos_backlogManageService.queryUserBacklogMsg',            
            PUSH_USER_BACKLOG_MSG: SERVICE_GATEWAY +"epframe.epbos_backlogManageService.pushUserBacklogMsg",
            PUSH_USER_BACKLOG_MSG_TMP: SERVICE_GATEWAY +"epframe.epbos_backlogManageService.pushUserBacklogMsgTmp",
            REMOVE_USER_BACKLOG_MSG_TMP: SERVICE_GATEWAY +"epframe.epbos_backlogManageService.removeUserBacklogMsgTmp"
        };

        //模板
        var mainTpl = '',
            itemTpl = '';
        mainTpl += '<div class="backlog-container">';
        mainTpl += ' <div  class="backlog-content"></div>';
		mainTpl += '</div>';
        itemTpl += '<li>'
        itemTpl += '  <a url="{backlog_url}">'
        itemTpl += '    <span>{show_name}</span>'
        itemTpl += '    <em>{backlog_count}</em>'
        itemTpl += '  </a>'
        itemTpl += '</li>'
        slideTpl = '<div class="backlog-slide"><ul>{itemsTpl}</ul></div>'

    var Backlog = function (options) {
        this.initialize(options);
    };
    Backlog.prototype = {
        initialize: function (options) {
            this.el = $(options.el);
            this.msgListCache ;
            this.websocketFlag = false;
            this.slideContents = []; // 根据页数, 填充每个slide内容
            this.pageSize = 8; // 每页记录数
        },
        render: function () {
            this._register();
            this._loadMsgs();
            this._backlogSetting();
            //this._testPushMsg();           
            this._bindEvent();

        },
        dispose: function () {
        },
        refresh: function () {
        }
    };
    /*注册监听服务 */
    Backlog.prototype._register =function(){
        if (false == this.websocketFlag) {
            Websocket({
                app_id: '0',
                protocol: _.startsWith(window.location.href, 'https:') ? 'wss' : 'ws',
                registerServices: '0000_pushBacklogMsg'
            });
            this.websocketFlag = true;
        }
    },
/*     Backlog.prototype._testPushMsg = function() {
        var _this = this;
        $.jsonRPC.request(service.REMOVE_USER_BACKLOG_MSG_TMP, {
            params: {
                //params: {"user_code" : "ADMIN", "backlog_code":"0001000002", "backlog_count":5}
                //params: {"user_code" : "ADMIN", "backlog_id":"0001000005", "backlog_count":4,"backlog_url":"/url/5.html","backlog_name":"临时待办任务5","app_id":0,"app_name":"结算产品","opr_type":"0"}
                params: {"user_code" : "ADMIN", "backlog_id":"0001000004", "opr_type":"1"}
            },
            success: function(response) {
                console.log(response);              
            },
            error: function(e){
                console.log(e);
            }
        }); 
    }, */
    /*加载待办任务消息列表*/ 
    Backlog.prototype._loadMsgs = function() {
        var _this = this;
        $.jsonRPC.request(service.QUERY_USER_BACKLOG_MSG, {
            params: {
                params: {}
            },
            success: function(response) {
                var list = response.data;             
                _this.msgListCache = list;
                _this._showMsgs(list);
                //_this._bindEvent();
            },
            error: function(e){
                console.log(e);
            }
        }); 
    },
    /*消息列表渲染展示 */
    Backlog.prototype._showMsgs = function(list) {
        this.slideContents = [];
        $(this.el).html(mainTpl);
        var itemArr = [];  
        _.forEach(list, function(item){
           //此处需要先取别名，别名为空再取原名
           if(item.backlog_alias !== undefined){
                item.show_name = item.backlog_alias;             
            }else{
                item.show_name = item.backlog_name;
            }
           var itemHtml = format(itemTpl, item);
           itemArr.push(itemHtml);
        }, this);
        // 组装每个slide内容,itemArr分成pageSize个数组
        var backlogTpl = '',
        itemsSize = _.chunk(itemArr, this.pageSize);
        _.each(itemsSize, function(items){  // TODO: 和上面的each合并处理
            notesTpl = format(slideTpl, {
                itemsTpl: items.join('')
            })
            this.slideContents.push(notesTpl)
        }, this);
        // 渲染swiperLite
        var swiptelite = new ESYS.swiperlite({
            el: '.backlog-content',
            data: {
                slideContents: this.slideContents
            }
        })
        swiptelite.render();
        this._backlogOpenMenu();
    }
    /*查看待办任务 */
    Backlog.prototype._backlogOpenMenu = function() {
        var _this = this;
        var backlogSlide = this.el.find(".swiperlite-wrapper .backlog-slide");
        _.forEach(backlogSlide,function(slide) {
            //点击待办事件绑定，打开对应菜单
            $(slide).find("li a ").click(function(e){ 
                console.log("click");           
                var url = $(this).attr("url"),
                    params = url.substr(url.indexOf("?")+1,url.length);
                //获取参数值                    
                function getParam(name,params){
                    var reg = new RegExp("(^|&)"+name+"=([^&]*)(&|$)"); 
                    var r =  params.match(reg);
                    var strValue = "";
                    if (r!=null){
                     strValue= unescape(r[2]);
                    }
                    return strValue;
                }
                var app_id = getParam("app_id",params),
                    menu_code = getParam("menu_code",params);
/*                     console.log(baseCommon.getContext());
                    console.log(baseCommon.getCurrentAppId()); */
                if(app_id == baseCommon.getCurrentAppId()){//本系统菜单
                    //console.log("切换本系统菜单");
                    window.top.openSelfMenuTab(menu_code);
                }else{
                    //console.log("切换子系统菜单");
                }
            });            
         });
        
    }
    /*待办配置 */
    Backlog.prototype._backlogSetting = function() {
        var _this = this;
        this.el.parent().find("i").click(function(){
            _this._loadBacklogSetting();
          });
    }
    /*加载配置对话框 */
    Backlog.prototype._loadBacklogSetting = function() {
        new ESYS.dialog({
            data: {
                width: 960,
                height: 420,
                title: '我的待办配置',
                url : ESYS.formaturl('/EPWEBRUN/epframe/release/portal/apps/backlog/child/setting'),
                options : {

                },
                buttons: [
                    {type: 'cancel'},
                    {type: 'save', title: '确定', handler: function(dlg) {
                        var inst = this.getInstance();
                        var cb = function() {
                            dlg.close();
                        }
                        inst.save && inst.save(cb);//保存
                    }}
                ]
            }
        }).render();
    }  
    /*待办任务消息事件监听*/
    Backlog.prototype._bindEvent = function() {
        var _this = this;
        Observer.on('xyz-websocket:0000_pushBacklogMsg', function(pushMsg) {
            if(pushMsg.backlog_type == "1"){
                if(pushMsg.opr_type == "0"){
                    var isExist = false;
                    var backlogCodeS = [];
                    _.forEach(_this.msgListCache, function(item){
                        backlogCodeS.push(item.backlog_code);
                    });
                    if($.inArray(pushMsg.backlog_code,backlogCodeS) == -1){//不存在,backlog_code的消息追加到消息列表
                        _this.msgListCache.push(pushMsg);
                        _this._showMsgs(_this.msgListCache);
                    }else{//已存在，更新backlog_code的消息数
                        _.forEach(_this.msgListCache, function(item){
                            if(item.backlog_code == pushMsg.backlog_code){
                                item.backlog_count = pushMsg.backlog_count;
                            }                          
                        });
                        _this._showMsgs(_this.msgListCache);
                    }

                }else{//找到临时消息列表，找到backlog_code的消息，移除
                    var removeIndex = -1;
                    $.each(_this.msgListCache,function(index,item){
                        if(item.backlog_code == pushMsg.backlog_code ){
                            removeIndex = index;
                        }          
                    });
                    removeIndex != -1 &&  _this.msgListCache.splice(removeIndex,1); 
                    _this._showMsgs(_this.msgListCache);
                }
            }else{//找到backlog_code的消息，更新消息数量
                    _.forEach(_this.msgListCache, function(item){
                        if(item.backlog_code == pushMsg.backlog_code){
                            item.backlog_count = pushMsg.backlog_count;
                        }                          
                    });
                    _this._showMsgs(_this.msgListCache);
            }
        });
        //待办列表已更新，需刷新列表
        Observer.on('backlogSetting:change', function(data) {
            _this._loadMsgs();
         
        });
    }
    module.exports = Backlog;
});
