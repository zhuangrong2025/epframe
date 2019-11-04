/**
 * 部门树面板组件.
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        objformat = require('objectformat'),
        DepTree = require('../../../public/deptree/DepTree');

    var tpl = require('./template/DepTreePanel.html');

    var DepTreePanel = function(options) {
        this.init(options);
    };

    DepTreePanel.prototype = {
        defaults: {
            title: '部门信息',
            events: {
                add: function() {},
                afterFilter: function(_m) {}
            }
        },
        init: function(options) {
            this.settings = $.extend({}, this.defaults, options);
            this.el = $(this.settings.el);
            this.timer;
        },
        render: function() {
            tpl = objformat(tpl, {
                title: this.settings.title
            });
            this.el.html(tpl);
            var deptreeId = _.uniqueId('deptree_gen');
            this.el.find(".esys-datalist-container").attr("id", deptreeId);
            this.depTree = new DepTree({
                el: "#" + deptreeId,
                events: this.settings.events
            });
            this.depTree.render();
            this._bindEvents();
        },
        dispose: function() {},
        refresh: function(params) {
            this.loadData(params);
        }
    };

    DepTreePanel.prototype.getSource = function() {
        return this.depTree.getTree().getSource();
    };

    DepTreePanel.prototype.setValue = function(v) {
        this.depTree.setValue(v);
    }
    DepTreePanel.prototype.getValue = function(v) {
        return this.depTree.getValue();
    }
    DepTreePanel.prototype.getTree = function() {
        return this.depTree.getTree();
    }
    DepTreePanel.prototype.updateNode = function(data) {
        return this.getTree().updateNode(data);
    }
    DepTreePanel.prototype.refreshTree = function() {
        var params = {'status': 0};
        if(this.el.find('#showAllDeptBtn').is(':checked')){
            params = {'status': 2};
        }
        return this.depTree.render(params);
    }

    DepTreePanel.prototype._bindEvents = function() {
        var _this = this,
            events = this.settings.events || {};

        function filterDepTree() {
            var text = $(this).val(),
                tree = _this.getTree();
            tree && tree.filter(text);
            if (_this.timer) {
                clearTimeout(_this.timer);
            }
            //树检索目前被改为异步的，但未提供检索完毕事件，此处暂且使用延时方式实现
            _this.timer = setTimeout(function() {
                events.afterFilter && events.afterFilter();
            }, 1000);
        }

        //搜索框输入事件
        this.el.find(".esys-search :text")
            .bind("propertychange", filterDepTree)
            .bind("input", filterDepTree);

        //新增事件
        this.el.find('button.add_btn').on('click', function() {
            events.add && events.add();
        });

        //切换是否显示已注销部门事件
        this.el.find('#showAllDeptBtn').change(function() {
            var params = {'status': 0};
            if($(this).is(':checked')){
                params = {'status': 2};
            }
            _this.depTree.render(params);
        });
    }

    module.exports = DepTreePanel;
});