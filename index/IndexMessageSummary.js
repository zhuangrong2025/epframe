define(function(require, exports, module) {

    var $ = require('jquery'),
        format = require('objectformat');

    //模板引入
    var mainTpl = require('./template/IndexMessageSummary.html'),
        messageItemTpl = '' +
        '<li data-id="{msgId}" title="查看详情">' +
        '    <h3>' +
        '        <i></i>' +
        '        <span>{title}</span>' +
        '        <em>{date}</em>' +
        '    </h3>' +
        '    <p>{summary}</p>' +
        '    <i class="xy-icon xy-view {status}" title="标为已读"></i>' +
        '</li>';

    //常量
    var MSG_STATUS_ALL = 0,
        MSG_STATUS_DISREAD = 1,
        MSG_STATUS_HASREAD = 2;

    var MSG_IS_READED_FLAG_NONE = '0',
        MSG_IS_READED_FLAG_DONE = '1';

    var REG_BKANK = /\s+/;

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        UPDATE_MSG_STATUS: SERVICE_GATEWAY + 'epframe.epbos_messageService.updateMsgStatus'
    };

    function IndexMessageSummary(options) {
        this.initialize(options);
    };

    IndexMessageSummary.prototype = {
        initialize: function(options) {
            this.el = options.el;
            this.jdom = {};
            this.cache = {
                status: MSG_STATUS_ALL,
                allMessages: [],
                allMessagesMap: {},
                filterMessages: []
            };
            this.events = $.extend({
                chooseMessage: function(item) {},
                updateMessageCounter: function(counter) {}
            }, options.events);
            this.lock = {
                status: false,
                timestamp: this._getTimestamp()
            };
            this.task = {
                timer: null,
                data: []
            };
            this.counter = {
                allread: 0,
                disread: 0,
                hasread: 0
            };
            this.typeTimer = null;
        },
        render: function() {
            this.el.html(mainTpl);
            this._doLock();
            this._init();
            return this;
        }
    };

    //初始化
    IndexMessageSummary.prototype._init = function() {
        var _this = this,
            jdom = this.jdom;

        //DOM句柄
        jdom.filterBox = this.el.find('div.nt-filter');
        jdom.allLabel = jdom.filterBox.find('label[role=all]');
        jdom.allRadio = jdom.allLabel.find(':radio');
        jdom.allCount = jdom.allLabel.find('span');
        jdom.disreadLabel = jdom.filterBox.find('label[role=disread]');
        jdom.disreadRadio = jdom.disreadLabel.find(':radio');
        jdom.disreadCount = jdom.disreadLabel.find('span');
        jdom.hasreadLabel = jdom.filterBox.find('label[role=hasread]');
        jdom.hasreadRadio = jdom.hasreadLabel.find(':radio');
        jdom.hasreadCount = jdom.hasreadLabel.find('span');
        jdom.searchBox = jdom.filterBox.find('div.esys-search :text');
        jdom.searchBtn = jdom.searchBox.next('i');

        jdom.listBox = this.el.find('div.nt-list');
        jdom.list = jdom.listBox.find('>ul');

        //设值
        jdom.allRadio.val(MSG_STATUS_ALL).prop('checked', true);
        jdom.disreadRadio.val(MSG_STATUS_DISREAD);
        jdom.hasreadRadio.val(MSG_STATUS_HASREAD);

        this._bindEvent();
    };

    //-----------------------

    //获取时间戳
    IndexMessageSummary.prototype._getTimestamp = function() {
        return (new Date()).getTime();
    };

    //判断锁
    IndexMessageSummary.prototype._isLock = function() {
        return this.lock.status;
    };

    //获取锁
    IndexMessageSummary.prototype._doLock = function() {
        this.lock.status = true;
        return this.lock.timestamp = this._getTimestamp();
    };

    //释放锁
    IndexMessageSummary.prototype._unLock = function(timestamp) {
        if (timestamp == this.lock.timestamp) {
            this.lock.status = false;
        }
    };

    //是否过滤消息
    IndexMessageSummary.prototype._isFilter = function(message, keyword) {
        var title = $('<span>' + message.msg_title + '</span>').text(),
            content = $('<span>' + message.content + '</span>').text();
        if ('' == keyword || title.indexOf(keyword) > -1 || content.indexOf(keyword) > -1) {
            return false;
        }
        return true;
    };

    //阅读状态过滤
    IndexMessageSummary.prototype._isInStatus = function(message) {
        if (message.is_readed == MSG_IS_READED_FLAG_NONE) {
            if (this.cache.status == MSG_STATUS_ALL || this.cache.status == MSG_STATUS_DISREAD) {
                return true;
            }
        } else {
            if (this.cache.status == MSG_STATUS_ALL || this.cache.status == MSG_STATUS_HASREAD) {
                return true;
            }
        }
        return false;
    };

    //清空消息
    IndexMessageSummary.prototype._emptyMessageList = function() {
        this.jdom.list.empty();
    };

    IndexMessageSummary.prototype._formatDate = function(date) {
        return date;
    };

    IndexMessageSummary.prototype._formatDay = function(date) {
        var yy = date.getFullYear(),
            mo = (1 + date.getMonth()),
            dd = date.getDate();
        return yy + '-' + (mo < 10 ? '0' + mo : mo) + '-' + (dd < 10 ? '0' + dd : dd);
    };

    IndexMessageSummary.prototype._convertDate = function(date) {
        var d1 = new Date(),
            d2 = new Date();
        var today = this._formatDay(d1);
        d1.setDate(d1.getDate() - 1);
        d2.setDate(d2.getDate() - 2);
        var yesterday = this._formatDay(d1);
        var dayBeforeYes = this._formatDay(d2);

        var day = new Date();
        day.setTime(date);
        var str = this._formatDay(day),
            hh = day.getHours(),
            mm = day.getMinutes();

        if (str == today) {
            str = '当天';
        } else if (str == yesterday) {
            str = '昨天';
        } else if (str == dayBeforeYes) {
            str = '前天';
        }

        str += ' ' + (hh < 10 ? '0' + hh : hh) + ':' + (mm < 10 ? '0' + mm : mm);
        return str;
    };

    //渲染消息列表
    IndexMessageSummary.prototype._renderMessage = function(message, isAppend) {
        var date = this._convertDate(message.create_time),
            summary = message.content,
            status = (message.is_readed == MSG_IS_READED_FLAG_NONE ? 'disread' : 'hasread'),
            html = format(messageItemTpl, {
                msgId: message.msg_id,
                title: message.msg_title,
                date: date,
                summary: summary,
                status: status
            });
        if (false === isAppend) {
            this.jdom.list.prepend(html);
        } else {
            this.jdom.list.append(html);
        }
    };

    //处理消息
    IndexMessageSummary.prototype._processMessage = function(message, keyword) {
        this.cache.allMessages.push(message);
        this.cache.allMessagesMap['' + message.msg_id] = message;
        if (true !== this._isFilter(message, keyword)) {
            this.cache.filterMessages.push(message);
            if (this._isInStatus(message)) {
                this._renderMessage(message, false);
            }
        }
    };

    //消息排序
    IndexMessageSummary.prototype._sortData = function(messages) {
        messages.sort(function(msgA, msgB) {
            var numA = parseInt(msgA.create_time),
                numB = parseInt(msgB.create_time);
            return numA - numB;
        });
    };

    //添加所有消息
    IndexMessageSummary.prototype._setMessages = function(messages) {
        var _this = this,
            lock = _this._doLock(),
            keyword = _this._getKeyword();
        if ($.isArray(messages)) {
            _this._sortData(messages);
            _this.cache.allMessages = [];
            _this.cache.allMessagesMap = {};
            _this.cache.filterMessages = [];
            _this._emptyMessageList();
            var counter = {
                allread: 0,
                disread: 0,
                hasread: 0
            };
            $.each(messages, function(i, item) {
                _this._processMessage(item, keyword);
                counter.allread++;
                if (item.is_readed == MSG_IS_READED_FLAG_NONE) {
                    counter.disread++;
                } else {
                    counter.hasread++;
                }
            });
            _this.counter = counter;
            _this._renderMessageCounter();
            if ($.isFunction(_this.events.updateMessageCounter)) {
                _this.events.updateMessageCounter($.extend({}, _this.counter));
            }
        }
        _this._unLock(lock);
    };

    //添加推送消息
    IndexMessageSummary.prototype._addMessages = function(messages) {
        var _this = this;
        if (null != _this.task.timer) {
            clearTimeout(_this.task.timer);
            _this.task.timer = null;
        }
        _this.task.data.push(messages);
        if (true == _this._isLock()) {
            _this._createMessagesTask();
        } else {
            _this._addMessagesInner();
        }
    };

    IndexMessageSummary.prototype._createMessagesTask = function() {
        var _this = this;
        if (null != _this.task.timer) {
            clearTimeout(_this.task.timer);
            _this.task.timer = null;
        }
        _this.task.timer = setTimeout(function() {
            if (true == _this._isLock()) {
                _this._createMessagesTask();
            } else {
                _this._addMessagesInner();
            }
        }, 1000);
    };

    IndexMessageSummary.prototype._addMessagesInner = function() {
        var _this = this,
            keyword = _this._getKeyword(),
            taskData = _this.task.data;
        _this.task.data = [];
        $.each(taskData, function(i1, data) {
            if ($.isArray(data)) {
                _this._sortData(data);
                $.each(data, function(i2, message) {
                    if (null == _this.cache.allMessagesMap['' + message.msg_id]) {
                        _this._processMessage(message, keyword);
                        _this.counter.allread++;
                        _this.counter.disread++;
                    }
                });
            } else if ($.isPlainObject(data)) {
                if (null == _this.cache.allMessagesMap['' + data.msg_id]) {
                    _this._processMessage(data, keyword);
                    _this.counter.allread++;
                    _this.counter.disread++;
                }
            }
        });
        _this._renderMessageCounter();
        if ($.isFunction(_this.events.updateMessageCounter)) {
            _this.events.updateMessageCounter($.extend({}, _this.counter));
        }
    };

    //获取关键字
    IndexMessageSummary.prototype._getKeyword = function() {
        return $.trim(this.jdom.searchBox.val());
    };

    //刷新列表
    IndexMessageSummary.prototype._refreshList = function() {
        var _this = this;
        _this._emptyMessageList();
        $.each(_this.cache.filterMessages, function(i, item) {
            if (_this._isInStatus(item)) {
                _this._renderMessage(item, false);
            }
        });
    };

    //切换列表状态
    IndexMessageSummary.prototype._changeStatus = function() {
        var lock = this._doLock();
        this._refreshList();
        this._unLock(lock);
    };

    //消息搜索
    IndexMessageSummary.prototype._filter = function() {
        var _this = this,
            lock = _this._doLock(),
            keyword = _this._getKeyword();
        if (_this.oldKeyword === keyword) {
            return;
        }
        var filterMessages = [];
        _this._emptyMessageList();
        $.each(_this.cache.allMessages, function(i, item) {
            if (true !== _this._isFilter(item, keyword)) {
                filterMessages.push(item);
                if (_this._isInStatus(item)) {
                    _this._renderMessage(item, false);
                }
            }
        });
        _this.cache.filterMessages = filterMessages;
        _this.oldKeyword = keyword;
        _this._unLock(lock);
    };

    //渲染消息统计数
    IndexMessageSummary.prototype._renderMessageCounter = function(off) {
        this.jdom.allCount.html(true === off ? '' : this.counter.allread);
        this.jdom.disreadCount.html(true === off ? '' : this.counter.disread);
        this.jdom.hasreadCount.html(true === off ? '' : this.counter.hasread);
    };

    //标志已读
    IndexMessageSummary.prototype._markAllReaded = function() {
        var _this = this,
            lock = _this._doLock(),
            msgIds = [];
        $.each(_this.cache.filterMessages, function(i, item) {
            if (_this._isInStatus(item) && item.is_readed == MSG_IS_READED_FLAG_NONE) {
                msgIds.push(parseInt(item.msg_id));
            }
        });
        _this._markReadedInner(msgIds, function() {
            _this._unLock(lock);
        });
    };

    //标志已读
    IndexMessageSummary.prototype._markOneReaded = function(msgId) {
        var _this = this,
            lock = _this._doLock(),
            msgIds = [],
            item = _this.cache.allMessagesMap['' + msgId];
        if (item && item.is_readed == MSG_IS_READED_FLAG_NONE) {
            msgIds.push(parseInt(msgId));
        }
        _this._markReadedInner(msgIds, function() {
            _this._unLock(lock);
        });
    };

    IndexMessageSummary.prototype._markReadedInner = function(msgIds, callback) {
        var _this = this,
            count = 0;
        if (0 == msgIds.length) {
            callback();
            return;
        }
        $.jsonRPC.request(service.UPDATE_MSG_STATUS, {
            params: {
                params: {
                    msg_ids: msgIds
                }
            },
            success: function(response) {
                $.each(msgIds, function(i, msgId) {
                    var item = _this.cache.allMessagesMap['' + msgId];
                    if (item && item.is_readed == MSG_IS_READED_FLAG_NONE) {
                        item.is_readed = MSG_IS_READED_FLAG_DONE;
                        count++;
                    }
                });
                _this.counter.disread -= count;
                _this.counter.hasread += count;
                _this._refreshList();
                _this._renderMessageCounter();
                if ($.isFunction(_this.events.updateMessageCounter)) {
                    _this.events.updateMessageCounter($.extend({}, _this.counter));
                }
                callback();
            },
            error: function(response) {
                callback();
            }
        });
    };

    //----------------------- 开放接口 - start

    //设置所有消息
    IndexMessageSummary.prototype.setMessages = function(messages) {
        this._setMessages(messages);
    };

    //追加新的消息
    IndexMessageSummary.prototype.addMessages = function(messages) {
        this._addMessages(messages);
    };

    IndexMessageSummary.prototype.turnOff = function() {
        clearTimeout(this.task.timer);
        clearTimeout(this.typeTimer);

        this.typeTimer = null;
        this.task.timer = null;
        this.task.data = [];

        this.cache.allMessages = [];
        this.cache.allMessagesMap = {};
        this.cache.filterMessages = [];
        this.lock.status = false;
        this.lock.timestamp = this._getTimestamp();

        this.counter.allread = 0;
        this.counter.disread = 0;
        this.counter.hasread = 0;

        this._emptyMessageList();
        this._renderMessageCounter(true);

        this.jdom.searchBox.val('');
    };

    //----------------------- 开放接口 - end

    //绑定页面事件
    IndexMessageSummary.prototype._bindEvent = function() {
        var _this = this;

        //标记所有
        this.jdom.filterBox.find('div[role=contrl]>span').on('click', function() {
            _this._markAllReaded();
        });

        //点击标记
        this.jdom.list.on('click', 'li>i', function() {
            var id = $(this).parent().attr('data-id');
            _this._markOneReaded(id);
            return false;
        });

        //展开消息盒子（查看详情）
        this.jdom.list.on('click', 'li', function() {
            var id = $(this).attr('data-id');
            if ($.isFunction(_this.events.chooseMessage)) {
                _this.events.chooseMessage($.extend({}, _this.cache.allMessagesMap[id]));
            }
            _this._markOneReaded(id);
            return false;
        });

        //消息展示状态切换
        this.jdom.allRadio
            .add(this.jdom.disreadRadio)
            .add(this.jdom.hasreadRadio).on('change', function() {
                _this.cache.status = $(this).val();
                _this._changeStatus();
            });

        //搜索按钮
        this.jdom.searchBtn.on('click', function() {
            _this._filter();
        });

        //搜索输入框
        this.jdom.searchBox.on('keyup', function(event) {
            if (null != _this.typeTimer) {
                clearTimeout(_this.typeTimer);
            }
            _this.typeTimer = setTimeout(function() {
                _this._filter();
            }, 600);
        });
    };

    module.exports = IndexMessageSummary;
});