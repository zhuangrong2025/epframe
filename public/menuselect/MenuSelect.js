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
        objformat = require('objectformat'),
        XyzTree = require('xyz-ztree'),
        Dialog = require('../component/dialog/Dialog'),
        ESYS = require('../common/ESYS'),
        Utils = require('../lib/utils'),
        Base = require('../component/Base');
    ESYS.require('datalist', 'alert');

    var tpl = '',
        dlgTpl = '',
        tableTpl = '';
    tpl += '<div class="esys-search esys-more xyz_validate_inst">';
    tpl += '<dl>';
    tpl += '<dt>';
    tpl += '<input type="text" class="form-control xyz_validate_input esys-readonly-light" readonly>';      
    tpl += '<i class="xy-icon xy-shenglvehao"></i>';
    tpl += '</dt>';
    tpl += '</dl>';
    tpl += '</div>';
    dlgTpl += '<div class="left_right_layout esys-border-collapse esys-collapse-3" style="height:400px;">';
    dlgTpl += '<div class="left_layout_wrap" style="width:40%"></div>';
    dlgTpl += '<div class="right_layout_wrap"  style="width:60%;">';
    dlgTpl += '<div>';
    dlgTpl += '<h5 class="section esys-section-main">功能列表</h5>';
    dlgTpl += '</div>';
    dlgTpl += '<div menu-tree style="height: calc(100% - 30px);"></div>';
    dlgTpl += '</div>';
    dlgTpl += '</div>';
    
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';
    var service = {
        APP_INFO_LIST: SERVICE_GATEWAY + 'epframe.epbos_systemInfoService.getAppInfoList',
        MENU_LIST : SERVICE_GATEWAY +'epframe.epbos_userRoleService.queryAllMenusByAppId'
    };
    var MenuSelect = Base.extend({
        defaults: {
            name: '' 
        },
        constructor: function (options) {
            MenuSelect.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.settings = $.extend({}, this.defaults, options);
            this.el = $(this.settings.el);
            this.selections = [];
            this.selectedAppId = null;
        },
        render: function () {
            /* tpl = objformat(tpl, {
                name: this.settings.name
            }); */
            this.el.html(tpl);
            if(this.settings.name) {
                this.el.find('.xyz_validate_inst').attr('name', this.settings.name).data('form', this);
            }
            this._bindEvents();
        },
        dispose: function () {
        },
        setValue: function (v) {
            
        },
        getValue: function () {
            var selectios = this.selections,
                codes = [];
            if(selectios.length) {
                selectios = this._filterLeafs(selectios);
                codes = _.pluck(selectios, 'menu_code');
            }
            return codes;
        }
    });
    MenuSelect.prototype._openDialog = function(v) {
        var _this = this;
		this.dialog = new Dialog({
            data: {
                width: 650,
                title: '功能选择',
                content: dlgTpl,
                buttons: [
                    {type: 'cancel', title: '清空', handler: function(dlg) {
                        _this.selections = [];
                        _this.selectedAppId = null;
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
        this.treeId === undefined ? this.treeId = _.uniqueId('menu_tree') : 0;
        this.dialog.find('[menu-tree]').attr('id', this.treeId);
        this._renderAppList();
        //this._renderUserTable();
    }
    MenuSelect.prototype._save = function(cb) {
        var selectios = this._getSelections();
        if(!selectios.length) {
            ESYS.alert.info('请选择功能!');
            return;
        }
        this.selections = selectios;
        var leafs = this._filterLeafs(selectios);
        this.selectedAppId = this.app.app_id;
        this.el.find(':text').val(_.pluck(leafs, 'menu_name').join(','));
        this.el.find(':hidden').val(_.pluck(leafs, 'menu_code').join(','));
        cb && cb();
    }
    //渲染左侧系统列表
    MenuSelect.prototype._renderAppList = function() {
        var _this = this;
        this.appList = new ESYS.datalist({
            el: '#' + this.listId,
            data: {
                title: '系统列表',
                value: this.selectedAppId,
                search: false,
                deletable: false,
                url: service.APP_INFO_LIST, //列表数据获取地址
                key: 'app_id',
                keyword: 'app_name',//搜索关键字
                text: 'app_name',
                pagination: false
            },
            events: {
                click: function(data) {
                    var change =  _this.app && _.isEqual(_this.app, data) ? false : true;
                    _this.app = data;
                    _this._createMenuTree(); 
                }
            }
        });
        this.appList.render();
    };
    MenuSelect.prototype._createMenuTree = function() {
        var _this = this,
            cur_app_id = this.app.app_id;
        /* if(!this.app_menus[cur_app_id]) { //初始未选中任何数据
            this.app_menus[cur_app_id] = [];
        } */
        if (this.tree) {
            this.tree.dispose();
        }
        this.tree = new XyzTree({
            el: '#'.concat(this.treeId),
            multiple: true,
            ajax: {
                url: service.MENU_LIST,
                id: 'menu_code',
                pid: 'parent_menu_code',
                text: 'menu_name',
                params: {
                    params: {
                        app_id: cur_app_id
                    }
                }
            },
            formatData: function(data) {
                var result = $.isArray(data) ? data : [];
                $.each(result, function(i, n) {
                    n.open = n.menu_level && n.menu_level < 2 ? true : false;
                });
                return result;
            },
            events: {
                dataCallback: function(tree) {
                    if(_this.selections && _this.selections.length) {//上次的选中项
                        var menucodes = _.pluck(_this.selections, 'menu_code');
                        tree.setValue(menucodes);
                    }
                },
                change: function(val, item, tree, status) { //复选框选中或取消选中
                    var list = tree.getData(), //所有菜单数据
                        selections = tree.getValue(); //当前选中数据
                   /* var checkall = list.length === selections.length ? true : false;
                    _this.app_checkall[_this.cur_app_id] = checkall;
                    _this.el.find('input[name=select_all]').prop("checked", checkall);*/
                }
            }
        });
        this.tree.render();
    }
    //只返回子节点
    MenuSelect.prototype._filterLeafs = function(selection) {
        var c = {}, pnodes = {}, leafs = [];
        _.each(selection, function(node) {
            c[node.menu_code] = node;
        }, this);
        _.each(selection, function(node) {
            if(c[node.parent_menu_code]) {//查找到父节点
                pnodes[node.parent_menu_code] = c[node.parent_menu_code];
            }
        }, this);
        _.each(selection, function(node) {
            pnodes[node.menu_code] || leafs.push(node);
        }, this);
        //只返回子节点
        return leafs;
    }
    MenuSelect.prototype._getSelections = function() {
        return this.tree.getValueData();
    }
    //绑定表格事件
    MenuSelect.prototype._bindTableEvent = function() {
        var $table = $('#'+this.tableId);
        $table.find('thead th:first :checkbox').unbind('click').bind('click', function() {
            $table.find('tbody>tr>td :checkbox').prop("checked", $(this).is(':checked')); 
        });
    }
    MenuSelect.prototype._bindEvents = function () {
        var _this = this;
        this.el.find('i.xy-icon').click(function() {
            _this._openDialog();
        });
    }

    module.exports = MenuSelect;
});