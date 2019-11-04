/**
 * 部门用户穿梭选择框.
 */
define(function(require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        XyzTree = require('xyz-ztree'),
        BaseComm = require('base-common-module'),
        XyzTab = require('xyz-tab');

    require('xyz-jsonRPC')($);

    var tpl = '';
    tpl += '<div app-tab></div>';
    tpl += '<div role-form class="form_combination clearfloat paddingtop8">';
    tpl += '    <div class="form_block">';
    tpl += '        <div class="form_block_content">';
    tpl += '            <div class="input-group">';
    tpl += '                <input type="text" class="form-control search-input-btn" placeholder="输入名称搜索">';
    tpl += '                <span class="input-group-btn">';
    tpl += '                    <button type="button" class="btn grey-steel search-icon-btn">';
    tpl += '                        <i class="fa fa-search"></i>';
    tpl += '                    </button>';
    tpl += '                </span>';
    tpl += '            </div>';
    tpl += '        </div>';
    tpl += '    </div>';
    tpl += '    <div class="form_checkbox pull-left" ctl>';
    tpl += '        <label class="mt-checkbox mt-checkbox-single mt-checkbox-outline">';
    tpl += '            <input type="checkbox" class="checkboxes" name="select_all"/>';
    tpl += '            全部授权';
    tpl += '            <span></span>';
    tpl += '        </label>';
    tpl += '    </div>';
    tpl += '    <div class="pull-right roleright_btns">';
    tpl += '        <button type="button" class="btn btn-edit"><i class="fa fa-edit"></i> 修改</button>';
    tpl += '        <button type="button" class="btn btn-save"><i class="fa fa-save"></i> 保存</button>';
    tpl += '        <button type="button" class="btn btn-cancel"><i class="fa fa-reply"></i> 取消</button>';
    tpl += '    </div>';
    tpl += '</div>';
    tpl += '<div menu-tree class="menu-tree-box select_box"></div>';

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    var service = {
        APP_INFO_LIST: SERVICE_GATEWAY + 'epframe.epbos_systemInfoService.getAppInfoList'
    };

    var RoleRightSelect = function(options) {
        this.initialize(options);
    };

    RoleRightSelect.prototype = {
        defaults: {
            /*
             * 数据加载地址, 直接配置字符串即为菜单列表请求地址，无已分配权限请求地址(新增的情况).
             * json对象的配置方式, {menus: menus_url, roleright: roleright_url}
             */
            url: ''
        },
        initialize: function(options) {
            this.el = $(options.el);
            this.settings = _.assign({}, this.defaults, options);
            this.role_id = options.role_id;
            this.dep_id = options.dep_id;
            this.mode = this.role_id ? 'view' : 'add'; //编辑模式，查看和新增两种
            this.app_list = []; //系统列表
            this.cur_app_id = 0; //当前系统Id
            this.app_menus = {}; //已选择的菜单数据
            this.app_checkall = {}; //子系统菜单全选状态
            if (_.isString(options.url)) { //只配置一个地址，即为新增情况，视为菜单列表地址
                _.assign(this.settings, {
                    url: {
                        menus: options.url,
                        roleright: '',
                        save: ''
                    }
                });
            }
            if (!this.settings.url.menus) throw new Error('menus url is undefined');
        },
        render: function() {
            this.el.html(tpl);
            undefined === this.tabId ? this.tabId = _.uniqueId('app_tab') : 0;
            undefined === this.formId ? this.formId = _.uniqueId('role_form') : 0;
            undefined === this.treeId ? this.treeId = _.uniqueId('menu_tree') : 0;
            this.el.children('[app-tab]').attr('id', this.tabId);
            this.el.children('[role-form]').attr('id', this.formId);
            this.el.children('[menu-tree]').attr('id', this.treeId);
            if (this.mode === 'view') { //查看可编辑模式
                $('#' + this.formId).addClass('shine_form');
            }
            this._initAppList();
            this._initEvents();
        },
        dispose: function() {
            this.tree && this.tree.dispose();
            this.appTab && this.appTab.dispose();
            this.tree = null;
            this.appTab = null;
            this.el.empty();
            this.app_menus = {};
        },
        refresh: function(opts) {
            if ($.isPlainObject(opts)) {
                undefined !== opts.dep_id ? this.dep_id = opts.dep_id : 0;
                undefined !== opts.role_id ? this.role_id = opts.role_id : 0;
            }
            this.dispose();
            this.render();
        }
    };

    //初始化数据
    RoleRightSelect.prototype.getData = function() {
        this._putCurrentAppMenus();
        return this.app_menus;
    }

    //初始化数据
    RoleRightSelect.prototype._initAppList = function() {
        var _this = this;
        $.jsonRPC.request(service.APP_INFO_LIST, {
            params: {
                params: {}
            },
            success: function(response) {
                var data = response.data;
                _this.cur_app_id = 1;
                if ($.isArray(data)) {
                    _this.app_list = data;
                    data.length > 0 ? _this.cur_app_id = data[0].app_id : 0;
                }
                _this._createElements();
            },
            error: function(response) {
                _this._createElements();
            }
        });
    }

    RoleRightSelect.prototype._createElements = function() {
            this._createAppTab();
            this._createMenuTree();
        }
        //渲染APP列表tab
    RoleRightSelect.prototype._createAppTab = function() {
            var _this = this,
                config = [];
            _.each(this.app_list, function(app, i) {
                config.push({
                    id: 'app_' + app.app_id,
                    title: app.app_name,
                    active: i === 0 ? true : false
                });
            });
            this.appTab = new XyzTab({
                el: '#'.concat(this.tabId),
                view: 'line',
                config: config,
                events: {
                    change: function(id, m) {
                        var app_id = id.replace('app_', '');
                        if (_this.cur_app_id === app_id) return;
                        _this._putCurrentAppMenus(); //切换时缓存前一个已选菜单数据
                        _this.cur_app_id = app_id;
                        var checkall = _this.app_checkall[app_id] ? true : false;
                        _this.el.find('input[name=select_all]').prop("checked", checkall);
                        _this._createMenuTree();
                    }
                }
            });
            this.appTab.render();
        }
        //创建菜单树
    RoleRightSelect.prototype._createMenuTree = function() {
        var _this = this,
            cur_app_id = this.cur_app_id;
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
                //url: service.MENU_LIST,
                url: this.settings.url.menus,
                id: 'menu_code',
                pid: 'parent_menu_code',
                text: 'menu_name',
                params: {
                    params: {
                        dep_id: this.dep_id,
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
                    if (_this.mode === 'view') { //查看模式
                        tree.disableAllCheck(true);
                    }
                    if (_this.role_id && !_this.app_menus[cur_app_id]) {
                        _this._loadRoleRights(cur_app_id);
                    } else {
                        var menus = _this.app_menus[cur_app_id];
                        if (menus && menus.length) {
                            if (_this.mode === 'view') { //查看模式
                                _this.tree.disableAllCheck(false);
                            }
                            tree.setValue(menus);
                            if (_this.mode === 'view') { //查看模式
                                _this.tree.disableAllCheck(true);
                            }
                        }
                    }
                },
                change: function(val, item, tree, status) { //复选框选中或取消选中
                    var list = tree.getData(), //所有菜单数据
                        selections = tree.getValue(); //当前选中数据
                    var checkall = list.length === selections.length ? true : false;
                    _this.app_checkall[_this.cur_app_id] = checkall;
                    _this.el.find('input[name=select_all]').prop("checked", checkall);
                }
            }
        });
        this.tree.render();
    }
    RoleRightSelect.prototype._loadRoleRights = function(app_id) {
            var _this = this;
            $.jsonRPC.request(this.settings.url.roleright, {
                params: {
                    params: {
                        role_id: this.role_id,
                        dep_id: this.dep_id,
                        app_id: app_id
                    }
                },
                success: function(response) {
                    var menus = response.data || [];
                    menus = _.filter(menus, function(m) {
                        return m.app_id == app_id;
                    });
                    menucodes = _.pluck(menus, 'menu_code');
                    _this.app_menus[app_id] = menucodes;
                    if (_this.mode === 'view') { //查看模式
                        _this.tree &&  _this.tree.disableAllCheck(false);
                    }
                    _this.tree.setValue(menucodes);
                    if (_this.mode === 'view') { //查看模式
                        _this.tree.disableAllCheck(true);
                    }
                },
                error: function(response) {

                }
            });
        }
        //缓存当前系统的选中菜单
    RoleRightSelect.prototype._putCurrentAppMenus = function() {
        if (this.mode !== 'view') { //只读模式无法取值，不设置当前选中菜单，使用初始加载的数据
            var menus = this.tree.getValue() || [];
            this.app_menus[this.cur_app_id] = menus;
        }
    }
    RoleRightSelect.prototype.save = function() {
        var _this = this;
        if (!this.settings.url.save) {
            throw new Error('save url is undefined!');
        }
        var data = this.getData();
        if (this.settings.beforesave && !this.settings.beforesave(this, data)) {
            return false;
        }
        $.jsonRPC.request(this.settings.url.save, {
            params: {
                params: {
                    role_id: this.role_id,
                    rights: data
                }
            },
            success: function(response) {
                $('#' + _this.formId).removeClass('edit');
                _this.mode = 'view';
                _this._putCurrentAppMenus();
                _this.tree.disableAllCheck(true);
            },
            error: function(response) {
                
            }
        });
    }

    RoleRightSelect.prototype._initEvents = function() {
        var _this = this;
        var timeoutId = null;

        function searchMenus() { //查找筛选菜单
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            var text = $(this).val();
            timeoutId = setTimeout(function() {
                _this.tree && _this.tree.filter(text);
            }, 500);
        }
        this.el.find(".search-input-btn").bind("propertychange", searchMenus)
            .bind("input", searchMenus);
        //全部授权
        this.el.find('input[name=select_all]').change(function() {
            var checked = $(this).is(":checked");
            _this.app_checkall[_this.cur_app_id] = checked; //子系统菜单全选状态
            _this.tree.checkAllNodes(checked);
        });
        this.el.find('.btn-edit').click(function() {
            $('#' + _this.formId).addClass('edit');
            _this.mode = 'edit';
            _this.tree.disableAllCheck(false);
        });
        this.el.find('.btn-cancel').click(function() {
            $('#' + _this.formId).removeClass('edit');
            _this.mode = 'view';
            _this.app_menus = {};
            _this.tree.disableAllCheck(true);
            _this._loadRoleRights(_this.cur_app_id);
        });
        this.el.find('.btn-save').click(function() {
            _this.save();
        });
    }

    module.exports = RoleRightSelect;
});