/**
 * 部门树组件.
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        Base = require('../component/Base'),
        XyzTee = require('xyz-ztree');

    require('xyz-jsonRPC')($);

    var DepTree = Base.extend({
        defaults: {
            url: '/EPSERVICERUN/json/USAccess/json.do?service=epcum.epbos_departmentService.queryAllDepts',
            list: [], //本地数据
            cascade: true //复选树默认级联选择, 不级联设置为false
        },
        constructor: function(options) {
            DepTree.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.settings = $.extend({}, this.defaults, options);
            this.settings.list.length && _.assign(this.settings, {url: null});
        },
        render: function(treeParams) {
            this.el = $(this.settings.el);
            var _this = this,
                url;
            url = '/EPSERVICERUN/json/USAccess/json.do?service=epframe.epbos_systemParamService.getParamByParamCode',
                $.jsonRPC.request(url, {
                    params: {
                        params: { param_code: 'IS_SHOW_DEP_CODE' }
                    },
                    success: function(response) {
                        var IS_SHOW_DEP_CODE = response.data && response.data.param_val === '1' ? true : false;
                        _this.renderTree(IS_SHOW_DEP_CODE, treeParams);
                    },
                    error: function(response) {
                        _this.renderTree(false, treeParams);
                    }
                });
            this._bindEvents();
        },
        dispose: function() {
            this.tree.dispose();
        },
        refresh: function() {
            this.loaded = false; //加载状态
            this.dispose();
            this.render();
        },
        filter: function() {

        },
        setValue: function(v) {
            if (this.tree && this.loaded) {
                this.tree.setValue(v);
            } else {
                this._setVal = v;
            }
        },
        getValue: function() {
            return this.tree.getValue();
        },
        getSelections: function() {
            return this.tree.getValueData();
        }
    });

    DepTree.prototype.getTree = function() {
        return this.tree;
    };

    DepTree.prototype.renderTree = function(IS_SHOW_DEP_CODE, params) {
        var _this = this;
        var params = params || { 'status': 0 }; //status: 0 仅显示正常部门, status:'' 显示所有
        var opt = this.settings._opt || {};
        if(this.settings.multiple && this.settings.cascade === false) {//复选不级联
            $(this.settings.el).addClass('esys-noncascade');
            _.assign(opt, {//不级联
                check: {
                    chkboxType : { "Y" : "", "N" : "" }
                }
            });
        }
        this.tree = new XyzTee({
            el: this.settings.el,
            ajax: {
                id: 'dep_id',
                pid: 'parent_dep_id',
                text: 'show_text',
                url: this.settings.url,
                list: this.settings.list,
                params: {
                    params: params //仅显示正常部门
                }
            },
            opt: opt,
            multiple: this.settings.multiple || false,
            formatData: function(data) {
                _this.loaded = true;
                $.each(data, function(i, n) {
                    n.open = true;
                    if (IS_SHOW_DEP_CODE == false) {
                        n.show_text = n.dep_name;
                    } else {
                        n.show_text = n.dep_code + "," + n.dep_name;
                    }
                });
                return data;
            }
        });
        this.tree.render();
        var _this = this;
        //树点击事件
        this.tree.on('click', function(nodeId, node) {
            _this.emit('click', node);
        });
        //树加载事件
        this.tree.on('dataCallback', function(tree) {
            _this._onDataCallback(tree);
        });
        if(this.settings.list.length) {
            _this._onDataCallback(this.tree);
        }
        //树选中前事件
        this.tree.on('beforeClick', function(val, valData, _m) {
            _this.emit('beforeClick', val, valData, _m);
        });
        //树选中发生变化
        this.tree.on('change', function(val, valData, _m, status) {
            _this.emit('change', val, valData, _m, status);
        });
    }
    DepTree.prototype._onDataCallback = function(tree) {
        var _this = this;
        if (_this._setVal) { //异步设值
            tree.setValue(_this._setVal);
            _this._setVal = null;
        }
        _this.emit('dataCallback', tree);
        var ztree = tree.getSource();
        //复选不级联情况下，双击自动进行级联
        if(_this.settings.multiple && _this.settings.cascade === false) {
            _this.el.find('[treenode]').dblclick(function(event) {
                event.stopPropagation();
                var nodeId = $(this).attr('id');
                var treeNode = ztree.getNodeByTId(nodeId);
                var checked = !treeNode.checked;
                ztree.checkNode(treeNode, checked, false);
                _this._checkNodeCascade(treeNode, checked);
            });
            _this.el.find('[treenode_check]').dblclick(function(event) {
                event.stopPropagation();
                var nodeId = $(this).parent().attr('id');
                var treeNode = ztree.getNodeByTId(nodeId);
                var checked = !treeNode.checked;
                ztree.checkNode(treeNode, checked, false);
                _this._checkNodeCascade(treeNode, checked);
            });
        }
    }
    DepTree.prototype._bindEvents = function() {
        var _this = this,
            events = this.settings.events;
        //事件绑定
        if (events) {
            _.forEach(events, function(fn, key) {
                this.on(key, fn, this);
            }, this);
        }
    }
    DepTree.prototype._checkNodeCascade = function(treeNode, checked) {
        var _this = this,
            ztree = this.tree.getSource();
        var childNodes = treeNode.children;
        function _checkNode(_node, _checked) {
            ztree.checkNode(_node, _checked, false);
            var _childNodes = _node.children;
            _.each(_childNodes, function(_n) {
                _checkNode(_n, _checked);
            });
        }    
        _.each(childNodes, function(node) {
            _checkNode(node, checked);
        });
    }

    module.exports = DepTree;
});