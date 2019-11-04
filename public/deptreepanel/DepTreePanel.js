/**
 * 部门树面板组件.
 */
define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        objformat = require('objectformat'),
        Base = require('../component/Base'),
        DepTree = require('../deptree/DepTree');

    var tpl = '';
    tpl += '<div class="esys-datalist">';
    tpl +=     '<div class="esys-datalist-head">';
                /* 搜索 组件  */
    tpl +=        '<div class="esys-search">';
    tpl +=            '<dl>';
    tpl +=                 '<dt>';
    tpl +=                      '<input type="text" class="form-control xyz_validate_input" placeholder="暂无过滤">';
    tpl +=                      '<i class="fa fa-search"></i>';
    tpl +=                 '</dt>';
    tpl +=            '</dl>';
    tpl +=         '</div>';
                 /*   搜索 组件  */
    tpl +=     '</div>';
    tpl +=    '<div class="esys-datalist-body">';
    tpl +=        '<h1>{title}<i class="xy-icon xy-reissue" title="刷新"></i></h1>';
    tpl +=        '<div class="esys-datalist-container"></div>';
    tpl +=    '</div>';
    tpl +='</div>';

    var DepTreePanel = Base.extend({
        defaults: {
            title: '部门信息'
        },
        constructor: function (options) {
            DepTreePanel.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.settings = $.extend({}, this.defaults, options);
            this.el = $(this.settings.el);
        },
        render: function () {
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
        dispose: function () {
        },
        setValue : function(v) {
            this.depTree.setValue(v);
        },
        getValue : function(v) {
            return this.depTree.getValue();
        },
        refresh: function (params) {
            this.loadData(params);
        },
        filter: function () {

        }
    });

    DepTreePanel.prototype.getTree = function() {
        return this.depTree.getTree();
    }

    DepTreePanel.prototype.refreshTree = function() {
        return this.depTree.refresh();
    }

    DepTreePanel.prototype._bindEvents = function () {
        var _this = this,
            tree = this.getTree(),
            events = this.settings.events || {};
        function filterDepTree() {
            var text = $(this).val();
            _this.getTree() && _this.getTree().filter(text);
        }
        this.el.find(".esys-search :text").bind("propertychange", filterDepTree)
            .bind("input", filterDepTree);
        this.el.find(".xy-reissue").bind("click",function(){
            _this.refreshTree();
        });
        //树点击事件
        this.depTree.on('click', function(node) {
            events.click && events.click(node);
        });
        this.depTree.on('dataCallback', function(node) {
            events.dataCallback && events.dataCallback(node);
        });
    }

    module.exports = DepTreePanel;
});
