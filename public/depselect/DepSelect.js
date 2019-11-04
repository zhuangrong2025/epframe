/*!
 * 菜单选择器.
 * 适用于表单中的菜单选择. 
 * 
 * Author: chenming
 * Date: 2019-06-18
 */
define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        XyzTree = require('xyz-ztree'),
        Dialog = require('../component/dialog/Dialog'),
        ESYS = require('../common/ESYS'),
        Base = require('../component/Base'),
        DepTree = require('../deptree/DepTree');
    ESYS.require('alert');

    var tpl = '',
        dlgTpl = '';
    tpl += '<div class="xyz_validate_inst" style="position:relative">';
    tpl += '<dl>';
    tpl += '<dt>';
    tpl += '<input type="text" class="form-control xyz_validate_input esys-readonly-light" readonly style="padding-right:30px;">';      
    tpl += '<i class="xy-icon xy-shenglvehao ipt-more-btn"></i>';
    tpl += '</dt>';
    tpl += '</dl>';
    tpl += '</div>';
    dlgTpl += '<div style="height:400px;">';
    dlgTpl += '<div>';
    dlgTpl += '<span class="esys-meta-desc"><i class="xy-icon xy-Prompt"></i> 双击部门自动关联选择所有子部门</span>';
    dlgTpl += '</div>';
    dlgTpl += '<div dep-tree style="height: calc(100% - 30px);"></div>';
    dlgTpl += '</div>';
    
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';
    var service = {
        DEP_TREE: SERVICE_GATEWAY + 'epcum.epbos_departmentService.queryAllDepts'
    };
    var DepSelect = Base.extend({
        defaults: {
            name: '' ,
            url: '/EPSERVICERUN/json/USAccess/json.do?service=epcum.epbos_departmentService.queryAllDepts',
            required: false
        },
        constructor: function (options) {
            DepSelect.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.settings = $.extend({}, this.defaults, options);
            this.useForm = this.settings.el ? true : false; //有渲染元素表示在表单中使用
            if(this.useForm) {
                this.el = $(this.settings.el);
            }
            this.selections = options.selections || [];
        },
        render: function () {
            if(this.useForm) {
                this.el.html(tpl);
                if(this.settings.name) {
                    this.el.find('.xyz_validate_inst').attr('name', this.settings.name);
                    this.el.find('.xyz_validate_input').attr('name', this.settings.name);
                }
                if(this.settings.required) {
                    this.el.find('.xyz_validate_input').attr('required', true);
                }
            }
            this._initComponent();
            this._bindEvents();
        },
        dispose: function () {
            this.tree && this.tree.dispose();
            this.dialog.dispose();
            this.el && this.el.empty();
        },
        setValue: function (v) {
            this.value = v;
            if(this.data) {
                this._setValue(v);
            }
        },
        getValue: function () {
            var selectios = this.selections,
                dep_ids = [];
            if(selectios.length) {
                dep_ids = _.pluck(selectios, 'dep_id');
            }
            return dep_ids;
        },
        getText: function() {
            return _.pluck(this.selections, 'dep_name').join(',')
        },
        open: function() {
            this._openDialog();
        }
    });
    DepSelect.prototype._initComponent = function() {
        var _this = this;
        $.jsonRPC.request(this.settings.url, {
            params: {
                params: { 'status': 0 }
            },
            success: function(response) {
                var data = response.data;
                _this.data = data;
                _this.value && _this._setValue(data);
                _this.emit('dataCallback', data);
            },
            error: function(response) {
            }
        });
    }
    DepSelect.prototype._openDialog = function(v) {
        var _this = this;
		this.dialog = new Dialog({
            data: {
                width: 650,
                title: '部门选择',
                content: dlgTpl,
                buttons: [
                    {type: 'cancel', title: '清空', handler: function(dlg) {
                        _this.selections = [];
                        _this.el.find(':text').val('');
                        _this.el.find(':hidden').val('');
                        dlg.close();
                    }},
                    {type: 'save', title: '确定', handler: function(dlg) {
                        var cb = function() {
                            dlg.close();
                        }
                        _this._save(cb);
                    }}
                ]
            }
        });
        this.dialog.render();
        this.listId === undefined ? this.listId = _.uniqueId('app_list') : 0;
        this.dialog.find('.left_layout_wrap').attr('id', this.listId);
        this.treeId === undefined ? this.treeId = _.uniqueId('dep_tree') : 0;
        this.dialog.find('[dep-tree]').attr('id', this.treeId);
        this._createDepTree();
    }
    DepSelect.prototype._save = function(cb) {
        var selections = this._getSelections();
        if(!selections.length) {
            ESYS.alert.info('请选择部门!');
            return;
        }
        this.selections = selections;
        cb && cb();
        if(this.useForm) {
            this.el.find(':text').val(_.pluck(selections, 'dep_name').join(','));
            this.el.find(':hidden').val(_.pluck(selections, 'dep_id').join(','));
        } else {
            this.settings.callback && this.settings.callback(this.selections);
        }
        
    } 
    DepSelect.prototype._setValue = function(val) {
        if(!val || !this.data) return;
        var _this = this;
        var selections = _.filter(this.data, function(item) {
            return _.indexOf(val, item['dep_id']) != -1;
        });
        this.selections = selections;
        if(this.useForm) {
            this.el.find(':text').val(_.pluck(selections, 'dep_name').join(','));
            this.el.find(':hidden').val(_.pluck(selections, 'dep_id').join(','));
        }
    }
    DepSelect.prototype._createDepTree = function() {
        var _this = this;
        if (this.tree) {
            this.tree.dispose();
        }
        this.tree = new DepTree({
            el: '#'.concat(_this.treeId),
            list: _this.data,
            multiple: true,
            cascade: false,
            events: {
                dataCallback : function(tree) {
                    tree.expandAll(true);
                    if(_this.selections && _this.selections.length) {//上次的选中项
                        var dep_ids = _.pluck(_this.selections, 'dep_id');
                        tree.setValue(dep_ids);
                    }                         
                }
            }
        });
        this.tree.render();
    }
    
    DepSelect.prototype._getSelections = function() {
        return this.tree.getSelections();
    }
    DepSelect.prototype._bindEvents = function () {
        var _this = this;
        if(this.useForm) {
            this.el.find('i.xy-icon').click(function() {
                _this._openDialog();
            });
        }
        var events = this.settings.events;
        //事件绑定
        if (events) {
            _.forEach(events, function(fn, key) {
                this.on(key, fn, this);
            }, this);
        }
    }

    module.exports = DepSelect;
});