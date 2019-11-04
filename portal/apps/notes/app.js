define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        format = require('objectformat'),
        XyzAlert = require('xyz-alert'),
        ESYS = require('../../../public/common/ESYS');
        ESYS.require('dialog', 'swiperlite');
 
        var fontAwesome = require('font-Awesome');
        // 引入todo  app样式
        require('./notes.css');
        //服务网关前缀
       var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service='; 
       //服务网关地址
       var service = {
          QUERY_USER_NOTES: SERVICE_GATEWAY + 'epframe.epbos_notesManageService.queryUserNotes',
          DEL_USER_NOTE: SERVICE_GATEWAY + 'epframe.epbos_notesManageService.delUserNote'
       }; 
        //模板 
        var mainTpl = '';
        mainTpl += '<div class="notes-container">';
        mainTpl += ' <div class="notes-content"></div>';
        mainTpl += ' <i class="xy-icon xy-dropdown-open notes-add"></i>';
        mainTpl += '</div>'; 

        var itemTpl = '';
        itemTpl += '<li class="{color}">'
        itemTpl += '  <a href="javascript:;">'
        itemTpl += '    <span>{content}</span>'
        itemTpl += '    <em>{process_time}</em>'
        itemTpl += '    <label class="notes-delete" data-id="{note_id}">&times;</label>'
        itemTpl += '  </a>'
        itemTpl += '  <i class="fa fa-star"></i>'
        itemTpl += '</li>' ; 

       var slideTpl = '<div class="notes-slide"><ul>{itemsTpl}</ul></div>';
    
    var Notes = function (options) {
        this.initialize(options);
        this.slideContents = []; // 根据页数, 填充每个slide内容
        this.pageSize = 8; // 每页记录数
    };
    Notes.prototype = {
        initialize: function (options) {
            this.el = $(options.el);
        },
        render: function () {
            this.el.html(mainTpl);  
            //查询
            this._queryUserNotes();
            //事件绑定
            this._bindEvent();
        },
        dispose: function () {
        },
        refresh: function () {
        }
    };
    /*
     * 渲染用户便签内容
    */ 
    Notes.prototype._queryUserNotes = function(){
       var itemArr = [],
           itemHtml;
        var _this = this; 
        $.jsonRPC.request(service.QUERY_USER_NOTES, {
            params: {
                params: {  
                }
            }, 
            async: false,
            success: function(response) {
              _this.slideContents = [];
              _.each(response.data, function(item){
                    itemHtml = format(itemTpl, item)
                    itemArr.push(itemHtml)
               }, _this);  
               //按每页内容pageSize把数据分组
               var itemArrPage = _.chunk(itemArr, _this.pageSize);
               _.each(itemArrPage, function(items){
                     _this.notesTpl = format(slideTpl, { itemsTpl: items.join('')});
                     _this.slideContents.push(_this.notesTpl);
                }, _this); 
                if( _this.swiptelite != null ){
                      _this.swiptelite.dispose();
                      _this.swiptelite = null;
                }
                _this._createSwiperLite();
            }
       });
    };
    // 创建swiperLite[水平滑动分页]，渲染数据
    Notes.prototype._createSwiperLite = function() {  
        var _this = this;
        this.swiptelite = new ESYS.swiperlite({
            el: '.notes-content',
            data: {
                slideContents: this.slideContents
            },
            events: {
                render : function() {//仅当渲染完成后才能绑定事件
                    _this._bindNotesDelete();
                }
            }
        });
        this.swiptelite.render();
    };
    // 事件绑定
    Notes.prototype._bindEvent = function() {
      var _this = this;
      // 添加便签
      $(".notes-add").on("click", function(){
        _this.dialog  = new ESYS.dialog({
            data: {
                width: 550,
                title: '添加便签',
                url: ESYS.formaturl('/EPWEBRUN/epframe/release/portal/apps/notes/child/add'),
                buttons: [
                    { type: 'cancel' },
                    {
                        type: 'save',
                        title: '确定',
                       handler: function(dlg) {
                            var inst = this.getInstance();
                            var cb = function() {
                                dlg.close();
                                _this._queryUserNotes();      
                            }
                            inst.save && inst.save(cb); //保存 

                        }
                    }
                ]
            }
        });
        _this.dialog.render(); 
      });
    };
    /**
      动态元素“删除”按钮绑定时间
    **/
    Notes.prototype._bindNotesDelete = function() {
      var _this = this;
      $(".notes-delete").on("click", function(){
          var note_id = $(this).attr('data-id');
          $.jsonRPC.request(service.DEL_USER_NOTE, {
            params: {
                params: { 
                   note_id: note_id
                }
            },
            success: function(response) { 
               // XyzAlert.info("系统提示：删除成功！");
                 _this._queryUserNotes();
            }
       });
     }); 
    };
    module.exports = Notes;
});
