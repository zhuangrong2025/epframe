define(function(require, exports, module) {
    var $ = require('jquery'),
        baseCommon = require('base-common-module'),
        shineForm = require('shine-form'),
        xyzAlert = require('xyz-alert'),
        XyzCover = require('xyz-coverlap'),
        Observer = require('observer'),
        XyzTreeselect = require('xyz-treeselect'),
        ShineValidator = require('shine-validator'),
        DepTreePanel = require('./DepTreePanel');

    require('xyz-jsonRPC')($);
    var ESYS = require('../../../public/common/ESYS');
    var PermissionControl = require('../../../public/permissioncontrol/PermissionControl');

    //模板引入
    var mainTpl = require('./template/DepManageMain.html');

    //全局常量
    var DEFAULT_DEP_CODE_LEN = 10; //默认部门代码长度

    //服务网关前缀
    var SERVICE_GATEWAY = '/EPSERVICERUN/json/USAccess/json.do?service=';

    //服务网关地址
    var service = {
        
        GET_DEP_INFO: SERVICE_GATEWAY + 'epcum.epbos_departmentService.getDepInfo',
        GET_PARENT_DEP: SERVICE_GATEWAY + 'epcum.epbos_departmentService.getParentDep',
        UPDATE_DEP_INFO: SERVICE_GATEWAY + 'epcum.epbos_departmentService.updateDepInfo',
        CANCEL_DEP: SERVICE_GATEWAY + 'epcum.epbos_departmentService.cancelDep',
        VALIDATE_DEP_NAME: SERVICE_GATEWAY + 'epcum.epbos_departmentService.validateDepName',
        GET_DEP_CODE_CUST: SERVICE_GATEWAY + 'epcum.epbos_departmentService.getDepCodeCustom',
        RECOVERY_DEP: SERVICE_GATEWAY + 'epcum.epbos_departmentService.setDepNormal'
    };

    //定义模块对象
    var DepManage = function(options) {
        this.initialize(options);
    };

    DepManage.prototype = { //模块原生方法
        initialize: function(options) {
            this.el = $(options.el);
            //组件引用
            this.parentDepTree;
            this.formValidator;
            //全局变量
            this.depId;
            this.depInfo;
            this.depCodeMinLen = DEFAULT_DEP_CODE_LEN;
            this.depCodeMaxLen = DEFAULT_DEP_CODE_LEN;
        },
        render: function() {
            //登录用户是否有访问权限
            var permission = new PermissionControl();
            if(!permission.allow()){
                return false;    //无权限不允许继续访问
            }
            this.el.html(mainTpl);
            this.form = $('#depForm');
            this._init();
        }
    };

    //初始化
    DepManage.prototype._init = function() {
        this._renderDepTree();
        this._getCustomedDepCodeLength();
        this._createFormValidate();
        this._bindEvent();
    };

    //渲染侧部门树面板
    DepManage.prototype._renderDepTree = function() {
        var _this = this;
        this.deptreePanel = new DepTreePanel({
            el: '#depTreePanel',
            events: {
                add: function() {
                    _this._openAddCoverlap();
                },
                'click': function(data) {
                    _this.depId = '' + data.dep_id;
                    _this._getDepInfo();
                    // _this._switchMode(false);
                    _this.checkDepStatus();
                },
                dataCallback: function(_m) {
                    _this._locateDepTreeNode();
                },
                afterFilter: function() {
                    _this._locateDepTreeNode(true);
                }
            }
        })
        this.deptreePanel.render();
    };
    //获取自定义部门代码长度
    DepManage.prototype._getCustomedDepCodeLength = function() {
        var _this = this;
        $.jsonRPC.request(service.GET_DEP_CODE_CUST, {
            params: {
                params: {}
            },
            success: function(response) {
                var data = response.data;
                var code = data.DEP_CODE_CUSTOM;
                if ('0' != code) {
                    //自定义部门代码长度
                    _this.isDepCodeCustom = true;
                    var codeArr = code.split(",");
                    if (codeArr.length == 1) {
                        _this.depCodeMinLen = codeArr[0];
                        _this.depCodeMaxLen = codeArr[0];
                    } else {
                        _this.depCodeMinLen = codeArr[0];
                        _this.depCodeMaxLen = codeArr[1];
                    }
                }
            },
            error: function(response) {
                xyzAlert.error('页面加载出错，请重新访问该页面!');
                window.console && console.log('获取自定义部门代码长度出错', response);
            }
        });
    };

    DepManage.prototype._locateDepTreeNode = function(isFilter) {
        var ztree = this.deptreePanel.getSource();
        if(ztree){
            var node = ztree && ztree.getNodeByParam('dep_id', this.depId) || null,
                pNode;
            if (node) {
                pNode = node.getParentNode();
                //节点存在则展开父节点
                ztree.expandNode(pNode, true, false, false);
                ztree.selectNode(node);
            } else {
                //默认选中根节点
                if (true !== isFilter) {
                    //节点不存在，设置为默认状态
                    this.depId = null;
                    this._clearForm();
                    var roots = ztree.getNodes();
                    if ($.isArray(roots) && roots.length > 0) {
                        ztree.selectNode(roots[0]);
                        this.deptreePanel.depTree.emit('click', roots[0]);
                    }
                }
            }
            this.checkDepStatus();
        }
        
    };

    DepManage.prototype.checkDepStatus = function() {
        var nodes = this.deptreePanel.getSource().getSelectedNodes();
        if ($.isArray(nodes) && nodes.length > 0) {
            if (nodes[0].children && nodes[0].children.length > 0) {
                    if(this._isAllWithdraw(nodes[0].children)){
                        $('#cancellation').removeAttr('disabled');
                    }else{//只要有一个子部门为正常部门则不能注销
                        $('#cancellation').attr('disabled', 'disabled');
                    }                
            } else {
                $('#cancellation').removeAttr('disabled');
            }
        }
    };
    //子部门是否全为注销部门
    DepManage.prototype._isAllWithdraw = function(nodes) {
        for(var i in nodes){
           if(nodes[i].dep_status == '0'){
                return false;
           }
        }
       return true;
    }

    DepManage.prototype.refreshDepTree = function() {
        this.deptreePanel.refreshTree();
    };

    DepManage.prototype._renderParentDepTree = function(callback) {
        var _this = this;
        if (null != this.parentDepTree) {
            this.parentDepTree.dispose();
        }
        this.parentDepTree = new XyzTreeselect({
            el: '#parent_dep_id',
            name: 'parent_dep_id',
            required: true,
            multiple: false,
            ajax: {
                id: 'dep_id',
                pid: 'parent_dep_id',
                text: 'dep_name',
                url: service.GET_PARENT_DEP,
                params: {
                    params: {
                        dep_id: _this.depId
                    }
                }
            },
            opt: {
                root: ''
            },
            events: {
                dataCallback: function(_m) {
                    callback.call(_this, _m);
                    //点击修改按钮后，点击其他部门时直接显示编辑状态
                    _this._switchMode(false);
                }
            }
        });
        this.parentDepTree.render();
    };

    //清空表单
    DepManage.prototype._clearForm = function() {
        this.formValidator && this.formValidator.resetForm();
        shineForm.setValue(this.form, {}, true);
    };
    //清空“非编辑”状态下表单
    DepManage.prototype._clearFormLbl = function() {
        $("#depForm").find("[lbl][field]").filter(function() {
            var name = $(this).attr("field");
            if (undefined !== name && null !== name && $.trim(name).length > 0) {
                return true;
            } else {
                return false;
            }
        }).each(function() {
            var jdom = $(this);
            jdom.text("");
        });
    }

    //创建表单验证器
    DepManage.prototype._createFormValidate = function() {
        //修改联系电话格式--临时解决方案
        $.validator && $.validator.addMethod("isTel", function(value, element) {
            var mobile = /^1[3456789]\d{9}$/;
            var tel = /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,8}$/;
            //var tel = /^(((\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,8})|(1[3456789]\d{9}))$/;
            return this.optional(element) || tel.test(value) || mobile.test(value);
        }, "请正确填写您的电话号码");
        this.formValidator = new ShineValidator({
            el: this.form,
            rules: {
                dep_name: {
                    custom: {
                        context: this,
                        dependency: function(nextHandler, value, element) {
                            if (this.depInfo.dep_name == value) {
                                //是当前部门名称
                                nextHandler(true);
                            } else {
                                this._validateDepName(value, function(data) {
                                    nextHandler(data);
                                });
                            }
                        }
                    }
                },
                parent_dep_id: {
                    custom: {
                        context: this,
                        dependency: function(nextHandler, value, element) {
                            nextHandler(this.depId !== value ? true : '上级部门与当前部门不能相同');
                        }
                    }
                },
                post: {
                    isZipCode: true
                },
                tel: {
                    isTel: true
                },
                email: {
                    email: true
                }
            }
        });
    };

    //验证部门名称是否已经存在
    DepManage.prototype._validateDepName = function(depName, callback) {
        $.jsonRPC.request(service.VALIDATE_DEP_NAME, {
            params: {
                params: {
                    dep_name: depName
                }
            },
            success: function(response) {
                callback(response.data > 0 ? '部门名称已存在' : true);
            },
            error: function() {
                callback('部门名称验证出错，请重试');
            }
        });
    };

    //编辑/非编辑模式切换
    DepManage.prototype._switchMode = function(isEditMode) {
        if (true === isEditMode) {
            if (null == this.depId || null == this.depInfo) {
                xyzAlert.info('请先在部门树选择部门！');
                return;
            } else if ('1' == this.depInfo.dep_status) {
                xyzAlert.info('该部门已经注销，禁止修改！');
                return;
            }
            shineForm.startEdit(this.form);
        } else {
            shineForm.stopEdit(this.form);
            this._showTitle(this.form);
            this.formValidator && this.formValidator.resetForm();
        }
        this.depInfo && shineForm.setValue(this.form, this.depInfo, true);
    };
    /**给内容较长的三个字段添加title属性  **/
    DepManage.prototype._showTitle = function(form) {
        form.find("div[field]").each(function(){
            var attr =  $(this).attr("field");
            if(attr == "dep_full_name" || attr == "note" || attr == "addr"){
                var title =  $(this).html();
                $(this).attr("title",title);
            }
        });
    };
    //获取部门信息
    DepManage.prototype._getDepInfo = function() {
        var _this = this;
        $.jsonRPC.request(service.GET_DEP_INFO, {
            params: {
                params: {
                    dep_id: _this.depId
                }
            },
            success: function(response) {
                var data = response.data;
                _this.depInfo = data;
                //如果是注销状态，则不允许编辑
                if(data.dep_status !== '0'){
                    $('#edit').attr('disabled', true);
                    $('#recovery').addClass('shown');
                    $('#cancellation').removeClass('shown');
                }else{
                    $('#edit').attr('disabled', false);
                    $('#cancellation').addClass('shown');
                    $('#recovery').removeClass('shown');
                }
                //$("#cancellation").attr("disabled", ('0' == data.dep_status) ? false : true);
                _this._renderParentDepTree(function() {
                    _this._clearFormLbl();
                    shineForm.setValue(_this.form, data, true);
                    _this._showTitle(_this.form);
                });
            },
            error: function() {
                xyzAlert.error('获取部门信息出错，请重试！');
            }
        });
    };

    //保存部门信息
    DepManage.prototype._saveDepInfo = function() {
        var _this = this,
            args = shineForm.getValue(this.form);
        args.dep_id = this.depId;
        $.jsonRPC.request(service.UPDATE_DEP_INFO, {
            params: {
                params: args
            },
            success: function(response) {
                xyzAlert.success('系统提示：修改部门成功！');
                _this.depInfo = args;
                Observer.trigger('DepInfo:update', args); //通知页面修改部门成功
                _this._switchMode(false);
                _this._showTitle(_this.form);
            },
            error: function(response) {
                xyzAlert.error('系统提示：' + (response.message ? response.message : (response.desc ? +response.desc : '修改部门失败！')));
                window.console && console.log('修改部门失败', response);
            }
        });
    };

    //改变部门状态-注销
    DepManage.prototype._changeDepStatus = function() {
        var _this = this;
        if (null != _this.depId) {
            xyzAlert.info('是否确认注销该部门？', {
                showCancelButton: true,
                closeOnConfirm: false,
                closeOnCancel: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                confirm: function() {
                    _this._saveDepStatus();
                },
                cancel: function() {
                    $("#cancellation").attr("disabled", false);
                },
            }, '');
        } else {
            xyzAlert.info('请先在部门树选择部门！');
        }
    };

    //改变部门状态-保存结果
    DepManage.prototype._saveDepStatus = function() {
        var _this = this;
        //保存
        $.jsonRPC.request(service.CANCEL_DEP, {
            params: {
                params: {
                    dep_id: _this.depId
                }
            },
            success: function(response) {
                $("#cancellation").attr("disabled", true);
                xyzAlert.success('系统提示：部门已注销！');
                _this.depInfo.dep_status = '1';
                var _dep = _this.depInfo,
                    parentDep = _this.deptreePanel.getTree().getNodeByParam('dep_id', _this.depInfo.parent_dep_id);
                    if(parentDep.parent_dep_id == null){
                        parentDep.parent_dep_id = 0;
                    }
                if (parentDep) {
                    _this.depInfo = parentDep;
                    _this.depId = parentDep.dep_id;
                }
                Observer.trigger('DepInfo:delete', _dep); //通知页面注销部门成功
                _this._switchMode(false);
            },
            error: function(response) {
                xyzAlert.error('系统提示：' + (response.message ? response.message : (response.desc ? +response.desc : '部门状态修改失败！')));
                window.console && console.log('部门状态修改失败', response);
                $("#cancellation").attr("disabled", false);
            }
        });
    };

    //恢复部门
    DepManage.prototype._recoveryDepStatus = function() {
        var _this = this;
        if (null != _this.depId) {
            xyzAlert.info('是否确认恢复该部门？', {
                showCancelButton: true,
                closeOnConfirm: false,
                closeOnCancel: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                confirm: function() {
                    _this._saveRecoveryDepStatus();
                },
                cancel: function() {
                    $("#cancellation").attr("disabled", false);
                },
            }, '');
        } else {
            xyzAlert.info('请先在部门树选择部门！');
        }
    };

    DepManage.prototype._saveRecoveryDepStatus = function(){
        var _this = this;
        //保存
        $.jsonRPC.request(service.RECOVERY_DEP, {
            params: {
                params: {
                    dep_id: _this.depId
                }
            },
            success: function(response) {
                xyzAlert.success('系统提示：部门已恢复！');
                _this.depInfo.dep_status = '0';
                $('#edit').attr('disabled', false);
                $('#recovery').removeClass('shown');
                $('#cancellation').addClass('shown');
                //对显示已注销用户的树有影响,否则取到的数据仍为恢复前的
                _this.refreshDepTree();           
            },
            error: function(response) {
                xyzAlert.error('系统提示：' + (response.message ? response.message : (response.desc ? +response.desc : '部门状态修改失败！')));
                window.console && console.log('部门状态修改失败', response);
                $("#cancellation").attr("disabled", false);
            }
        });
    }

    DepManage.prototype._openAddCoverlap = function() {
        var cover = new XyzCover({
            id: 'departAdd',
            child: {
                path: ESYS.formaturl('/EPWEBRUN/epframe/release/esystem/department/depmanage/DepManageAdd'),
                options: {
                    depCodeLen: {
                        min: this.depCodeMinLen,
                        max: this.depCodeMaxLen
                    },
                    parentDepId: this.depId
                }
            }
        });
        cover.render();
    };

    //绑定事件
    DepManage.prototype._bindEvent = function() {
        var _this = this;

        //添加部门
        $('#btn-add').on('click', function() {
            xyzAlert.info(msg, {
                showCancelButton: true,
                closeOnConfirm: true,
                closeOnCancel: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                confirm: function() {}
            }, '');
        });

        //保存部门信息
        $('#save').on('click', function() {
            _this.formValidator && _this.formValidator.form(function(valid) {
                if (true === valid) {
                    _this._saveDepInfo();
                }
            });
        });

        //编辑
        $('#edit').on('click', function(e) {
            _this._switchMode(true);
        });

        //取消
        $('#cancel').on('click', function(e) {
            _this._switchMode(false);
        });

        //点击"注销"触发事件
        $('#cancellation').on('click', function(e) {
            if (false == $(this).prop('disabled')) {
                _this._changeDepStatus();
            }
        });

        //点击"恢复"触发事件
        $('#recovery').on('click', function(e) {
            _this._recoveryDepStatus();
        });

        //新增一个部门,刷新部门树并选中原来的选中节点
        Observer.on('DepInfo:add', function(data) {
            this.deptreePanel.refreshTree();
            this.deptreePanel.setValue(data.parent_dep_id);
        }, this);
        //修改部门, 将修改数据同步到树节点上
        Observer.on('DepInfo:update', function(data) {
            this.deptreePanel.refreshTree();
            this.deptreePanel.setValue(data.dep_id);
        }, this);
        //注销部门, 移除该部门，选中上级部门
        Observer.on('DepInfo:delete', function(data) {
            this.deptreePanel.refreshTree();
            this.deptreePanel.setValue(data.parent_dep_id);
        }, this);
    };

    module.exports = DepManage;
})