/**
 * 步骤组件应用层封装.
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        XyzAlert = require('xyz-alert'),
        ShineStep = require('shine-step');

    require('xyz-jsonRPC')($);
    //操作状态
    var ACTION_STATUS = {
        DOING : 1, //正在执行
        FREED : 0  //空闲
    };

    var Step = function(options) {
        this.initialize(options);
    };

    Step.prototype = {
        initialize: function(options) {
            this.el = $(options.el);
            this.items = options.items;
            this.buttons = options.buttons;
            this.url = options.url;//提交地址
            this.height = options.height || 500;
            var events = options.events || {};
            this.actionStatus = ACTION_STATUS.FREED;//保存操作状态
            this.exitHandler = events.exit || _.noop();
            this.changeHandler = events.change || _.noop();
        },
        render: function() {
            this._buildConfig();
            this._renderStep();
        },
        dispose: function() {},
        refresh: function() {

        }
    };
    //构建配置项
    Step.prototype._buildConfig = function() {
        this.config = [];
        _.each(this.items, function(item, i) {
            this.config.push({
                id: item.id || _.uniqueId('esys_step_'),
                name : item.name || 'step'.concat(i),
                title : item.title || '步骤'.concat(i + 1),
                child: {
                    path: item.url,
                    options: _.assign(item.options || {}, {ctx: this})
                }
            });
        }, this);
    }
    //创建步骤
    Step.prototype._renderStep = function() {
        var _this = this;
        this.step = new ShineStep({
            el: this.el,
            buttons: this.buttons,
            config: this.config,
            events: {
                change: function(id, status, finish, _m){
                    if($.isFunction(_this.changeHandler)){
                        _this.changeHandler(id, status, finish, _this);
                    }
                },
                beforeChange:  function(id, status, finish, step, cb) {
                    _this._beforeStepChange.apply(_this, arguments);
                },
                save: function(step) {
                    var curId = step.getCurrentCheckId(),
                        curInstance = step.getInstanceById(curId);
                    //最后一步校验并保存
                    _this._checkInstance(curInstance, function() {
                        _this._save()
                    });
                },
                presave: function(index, id, step) {
                    var curInstance = step.getInstanceById(id);
                    //当前步骤校验并保存
                    _this._checkInstance(curInstance, function() {
                        _this._save(index);
                    });
                },
                cancel: function() {
                    XyzAlert.confirm('数据未保存，是否要离开本页?', {
                        confirmButtonText : '是',
                        cancelButtonText : '否',
                        confirm: function() {
                            XyzAlert.close();
                            _this._exit();
                        },
                        cancel: function() {
                            XyzAlert.close();
                        }
                    })
                }
            }
        });
        this.step.render();
        // this.el.find('.shine-step-content').css('minHeight', this.height);
    }
    //切换前的处理逻辑
    Step.prototype._beforeStepChange = function(id, status, finish, step, cb) {
        if(status === true && finish === false) { //人为点击了灰色步骤部分，不允许切换
            return false;
        }
        var curId = step.getCurrentCheckId(),
            curIndex = step.getCurrentCheckIndex(),
            curInstance = step.getInstanceById(curId),
            index = _.findIndex(this.config, function(item) {//新切换的步骤索引
                return item.id === id;
            });
        if(index < curIndex) { //上一步不需要判断, 直接跳转
            cb();
            return;
        }
        this._checkInstance(curInstance, cb);//检验切换状态
    }
    //实例校验
    Step.prototype._checkInstance = function(instance, cb) {
        var changeResult = instance.checkChange ? instance.checkChange() : {};
        if(changeResult === true) {
            changeResult = {status: 1};
        } else if(changeResult === false) {
            changeResult = {status: 0};
        }
        var status = changeResult.status || 0; //1:直接跳转,0:不允许跳转, -1:允许跳转，用户自行选择
        if(status === 1) {//允许跳转到下一步
            cb && cb();
        } else if(status === -1) {//有数据发生变化，允许跳转
            var tips = changeResult.message || '当前页面发生了修改, 是否继续?';
            XyzAlert.confirm(tips, {
                confirmButtonText : '是',
                cancelButtonText : '否',
                success: function(){
                    XyzAlert.close();
                    cb && cb();
                },
                cancel: function(){
                    XyzAlert.close();
                    cb && cb();
                }
            })
        } else {//不允许切换到下一步
            if(changeResult.message) {
                XyzAlert.warning(changeResult.message);
            }
        }
    }
    //获取指定步骤的数据
    Step.prototype.getStepData = function(index) {
        var item = this.config[index],
            id = item.id,
            name = item.name,
            instance = this.step.getInstanceById(id);
        var data = instance.getData  ? instance.getData() : null;
        return data;
    }
    //获取各步骤的数据
    Step.prototype.getData = function(index) {
        var data = [], name;
        _.each(this.config, function(item, i) {
            if(!_.isUndefined(index) && i > index) {//取指定前几步的数据
                return false;
            }
            data.push([item.name, this.getStepData(i)]);
        }, this);
        return _.zipObject(data);
    }
    //数据提交
    Step.prototype._save = function(index) {
        //有index表示中间过程中提前提交并退出的情况
        var data = this.getData(index),
            _this = this;
        if(this.actionStatus === ACTION_STATUS.DOING) {
            return;
        }
        this.actionStatus['save'] = ACTION_STATUS.DOING;//正在处理
        //保存数据
        $.jsonRPC.request(this.url, {
            params: {
                params: data
            },
            success: function(response) {
                XyzAlert.success('保存成功!');
                _this._exit('save');
                _this.actionStatus['save'] = ACTION_STATUS.FREE; //空闲状态
            },
            error: function(response) {
                _this.actionStatus['save'] = ACTION_STATUS.FREE; //空闲状态
            	XyzAlert.error('系统提示：数据保存失败！' + (response.message ? '[' + response.message + ']' : ''));
            }
        });
    }
    //数据提交
    Step.prototype._exit = function(action) {
        this.exitHandler(action);
    };
    //获取指定模块
    Step.prototype.getInstanceById = function(id){
        return this.step.getInstanceById(id);
    };

    module.exports = Step;
});
