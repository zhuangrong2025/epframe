/**
 * 页面权限控制组件.
 */
define(function (require, exports, module) {
    var $ = require('jquery'),
        Base = require('../component/Base'),
        baseCommon = require('base-common-module'),
        objformat = require('objectformat');
    
    var tpl = '';
    tpl +=  '<div class="permission-mask-wrapper">';
    tpl +=      '<div class="permission-mask">';
    tpl +=          '<div>';
    tpl +=              '<i class="xy-icon xy-plaint"></i>';
    tpl +=              '<span>{errorTips}</span>';
    tpl +=          '</div>';
    tpl +=      '</div>';
    tpl +=  '</div>';

    var PermissionControl = Base.extend({
        defaults: {
            userGroup: ['1','2'],
            errorTips: '抱歉，你无权访问该页面！'
        },
        constructor: function (options) {
            PermissionControl.superclass.constructor.call(this, options);
            this.init(options);
        },
        init: function(options) {
            this.settings = $.extend({}, this.defaults, options); 
            var userInfo = baseCommon.getUser();
            var currentUserGroup = userInfo.user_group;
            if(this.settings.userGroup && this.settings.userGroup.indexOf(currentUserGroup) >= 0){
                this.flag = true;
            }else{
                tpl = objformat(tpl, {
                    errorTips: this.settings.errorTips
                });
                $('body').append(tpl);
                this.flag =  false;
            }
        },
        allow: function(){
            return this.flag;
        }
    });

    module.exports = PermissionControl;
});
