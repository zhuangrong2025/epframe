/*!
 * 用户选择器.
 * 适用于表单中的用户选择. 
 * 
 * Author: chenming
 * Date: 2019-02-21
 */
define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        objformat = require('objectformat'),
        Dialog = require('../component/dialog/Dialog'),
        DepTreePanel = require('../deptreepanel/DepTreePanel'),
        ESYS = require('../common/ESYS'),
        Utils = require('../lib/utils'),
        Base = require('../component/Base');
    ESYS.require('datatable', 'alert');

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
    dlgTpl += '<div class="left_right_layout esys-border-collapse" style="height:400px;">';
    dlgTpl += '<div class="left_layout_wrap" style="width:40%"></div>';
    dlgTpl += '<div class="right_layout_wrap"  style="width:60%;">';
    dlgTpl += '<div>';
    dlgTpl += '<h5 class="section esys-section-main">用户列表</h5>';
    dlgTpl += '</div>';
    dlgTpl += '<div style="height: calc(100% - 30px);"></div>';
    dlgTpl += '</div>';
    dlgTpl += '</div>';
    tableTpl += '<table class="table custom_table" style="margin-bottom:0;">';
    tableTpl += '<thead>';
    tableTpl += '<tr>';
    tableTpl += '<th width="50">';
    tableTpl += '<label class="mt-checkbox mt-checkbox-outline">';
    tableTpl += '<input type="checkbox" class="checkboxes"/>';
    tableTpl += '<span></span>';
    tableTpl += '</label>';
    tableTpl += '</th>';
    tableTpl += '<th>用户名</th>';
    tableTpl += '<th>姓名</th>';
    tableTpl += '</tr>';
    tableTpl += '</thead>';
    tableTpl += '</table>';
    tableTpl += '<div style="height: calc(100% - 36px);overflow:auto;">';
    tableTpl += '<table class="table custom_table" style="margin-bottom:0;margin-top: -1px;">';
    tableTpl += '<tbody>';
    tableTpl += '<%for(var i=0,item; item=users[i]; i++){%>';
    tableTpl += '<tr>';
    tableTpl += '<td width="50">';
    tableTpl += '<label class="mt-checkbox mt-checkbox-outline">';
    tableTpl += '<input data-code="<%=item.user_code%>" type="checkbox" class="checkboxes"/>';
    tableTpl += '<span></span>';
    tableTpl += '</label>';
    tableTpl += '</td>';
    tableTpl += '<td><%=item.user_code%></td>';
    tableTpl += '<td><%=item.user_name%></td>';
    tableTpl += '</tr>';
    tableTpl += '<%}%>';
    tableTpl += '<%if(!users || !users.length) {%>';
    tableTpl += '<tr>';
    tableTpl += '<td colspan="3" class="empty-tips">没有用户数据</td>';
    tableTpl += '<%}%>';
    tableTpl += '</tbody>';
    tableTpl += '</table>';
    tableTpl += '</div>';
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';
    var service = {
        QUERY_USERS : SERVICE_GATEWAY + 'epframe.epbos_userManageService.queryUsersByDepId'
    };
    var UserSelect = Base.extend({
        defaults: {
            name: '' 
        },
        constructor: function (options) {
            UserSelect.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.settings = $.extend({}, this.defaults, options);
            this.el = $(this.settings.el);
            this.selections = [];
            this.selectedDepId = null;
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
                codes = _.pluck(selectios, 'user_code');
            }
            return codes;
        }
    });
    UserSelect.prototype._openDialog = function(v) {
        var _this = this;
		this.dialog = new Dialog({
            data: {
                width: 650,
                title: '用户选择',
                content: dlgTpl,
                buttons: [
                    {type: 'cancel', title: '清空', handler: function(dlg) {
                        _this.selections = [];
                        _this.selectedDepId = null;
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
        this._renderDepTree();
        this._renderUserTable();
    }
    UserSelect.prototype._save = function(cb) {
        var selectios = this._getSelections();
        if(!selectios.length) {
            ESYS.alert.info('请选择用户!');
            return;
        }
        this.selections = selectios;
        this.selectedDepId = this.deptreePanel.getValue();
        this.el.find(':text').val(_.pluck(selectios, 'user_name').join(','));
        this.el.find(':hidden').val(_.pluck(selectios, 'user_code').join(','));
        cb && cb();
    }
    //渲染侧部门树面板
    UserSelect.prototype._renderDepTree = function() {
        var _this = this;
        var treeId = _.uniqueId('deptree_gen');
        this.dialog.find('.left_layout_wrap').attr('id', treeId);
        this.deptreePanel = new DepTreePanel({
            el: '#' + treeId,
            events: {
                click : function(data) {
                    _this._loadUsers(data.dep_id)
                }
            }
        })
        this.deptreePanel.render();
        if(this.selectedDepId) {
            this.deptreePanel.setValue(this.selectedDepId);
        }
    };
    //渲染表格
    UserSelect.prototype._renderUserTable = function() {
        var _this = this;
        this.tableId = _.uniqueId('usertable_gen');
        this.dialog.find('.right_layout_wrap').children().last().attr('id', this.tableId);
        this._loadUsers(this.selectedDepId || -1);
    }
    //加载用户列表
    UserSelect.prototype._loadUsers = function(dep_id) {
        var tableId = this.tableId;
        var _this = this;
        $.jsonRPC.request(service.QUERY_USERS, {
            params: {
                params: {dep_id: dep_id || -1}
            },
            success: function(response) {
                var data = {users: response.data};
                _this.users = data.users;
                var $table = $('#' + tableId);
                $table.html(Utils.tmpl(tableTpl, data));
                if(_this.selections && _this.selections.length) {//上次的选中项
                    _.each(_this.selections, function(user) {
                        $table.find('tbody>tr>td :checkbox[data-code=' + user.user_code + ']').prop("checked", true); 
                    });
                }
                _this._bindTableEvent();
            },
            error: function(response) {
                
            }
        });
    }
    UserSelect.prototype._getSelections = function() {
        var $table = $('#'+this.tableId);
        var users = this.users;
        var selections = [];

        $table.find('tbody>tr>td :checkbox:checked').each(function() {
            var user_code = $(this).attr('data-code');
            var data = _.find(users, function(user) {
                return user.user_code === user_code;
            });
            if(data) {
                selections.push(data);
            }
        });
        return selections;
    }
    //绑定表格事件
    UserSelect.prototype._bindTableEvent = function() {
        var $table = $('#'+this.tableId);
        $table.find('thead th:first :checkbox').unbind('click').bind('click', function() {
            $table.find('tbody>tr>td :checkbox').prop("checked", $(this).is(':checked')); 
        });
    }
    UserSelect.prototype._bindEvents = function () {
        var _this = this;
        this.el.find('i.xy-icon').click(function() {
            _this._openDialog();
        });
    }

    module.exports = UserSelect;
});