/**
 * 带快速选择的日期范围选择组件.
 */
define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('lodash'),
        objformat = require('objectformat'),
        Base = require('../component/Base'),
        DateUtils = require('../lib/date-utils'),
        datepicker = require('xyz-datepicker-range');

    var tpl = '';
        tpl += '<div class="esys-datepicker-tablist">';
        tpl += '<span class="esys-datepicker-select"></span>';
        tpl += '<input type="hidden" class="xyz_validate_input" name="{startKey}"/>';
        tpl += '<input type="hidden" class="xyz_validate_input" name="{endKey}"/>';
        tpl += '</div>';

    var DateRangePicker = Base.extend({
        defaults: {
            tabs: [],
            startKey: 'start_time', 
            endKey: 'end_time',
            format: 'y-m-d' //日期默认格式
        },
        constructor: function (options) {
            DateRangePicker.superclass.constructor.call(this, options);
            this.initialize(options);
        },
        initialize: function(options) {
            this.settings = $.extend({}, this.defaults, options);
            this.el = $(this.settings.el);
        },
        render: function () {
            tpl = objformat(tpl, {
                startKey: this.settings.startKey,
                endKey: this.settings.endKey
            });
            this.el.html(tpl);
            var pickerId = _.uniqueId('datepicker_gen');
            this.el.find('.esys-datepicker-select').attr('id', pickerId);
            this.datepicker = new datepicker({
                el: "#" + pickerId,
                startKey: this.settings.startKey, 
                endKey: this.settings.endKey
            });
            this.datepicker.render();
            this._renderTabs();
            this._bindEvents();
        },
        dispose: function () {
        },
        setValue: function (v) {
            if(!_.isUndefined(v) && _.isObject(v)) {
                this.datepicker.setValue(v);
                this._setInputValue(v);
                this._updateTabsStatus(v);
            }
            
        },
        getValue: function () {
            return this.datepicker.getValue();
        }
    });
    DateRangePicker.prototype._resolveDate = function(t) {
		if (!t) return null;
		if (/%TODAY([+-]\d+)?/.test(t)) {
            var n = parseInt(RegExp.$1, 10) || 0,
			today = new Date();
			today.setDate(today.getDate() + n);
			t = DateUtils.date2str(today, this.settings.format);
		}
		return t
    }
    DateRangePicker.prototype._resolveTab = function (tab) {
        var reg = /^(\%TODAY\-\d+)|(\%TODAY)|(\%TODAY\+\d+)$/, 
            from = tab.from,
            to = tab.to,
            range = tab.range;
        if(reg.exec(from)) {//使用%TODAY+/-days的表达式
            from = this._resolveDate(from);
        }
        if(reg.exec(to)) {//使用%TODAY+/-days的表达式
            to = this._resolveDate(to);
        }
        var period = ''; 
        if(range === 'TWEEK') {
            period = DateUtils.getWeekPeriod();
        }
        if(range === 'LWEEK') {
            var d = new Date();
            d.setDate(d.getDate() - 7);
            period = DateUtils.getWeekPeriod(d);
        }
        if(range === 'TMONTH') {
            period = DateUtils.getMonthPeriod();
        }
        if(range === 'LMONTH') {
            var d = new Date();
            d.setDate(d.getMonth() - 1);
            period = DateUtils.getMonthPeriod(d);
        }
        if(range === 'TQUARTER') {
            period = DateUtils.getQuarterPeriod();
        }
        if(range === 'LQUARTER') {
            var d = new Date();
            d.setDate(d.getMonth() - 3);
            period = DateUtils.getQuarterPeriod(d);
        }
        if(range === 'TYEAR') {
            period = DateUtils.getYearPeriod();
        }
        if(range === 'LYEAR') {
            var d = new Date();
            d.setDate(d.getYear() - 1);
            period = DateUtils.getYearPeriod(d);
        }
        if(period) {
            from = period.from;
            to = period.to;
        }
        return {
            label: tab.label,
            from: from,
            to: to,
            active: tab.active
        }
    }
    DateRangePicker.prototype._renderTabs = function () {
        var tabsHtml = '';
        var tabTpl = '<span class="esys-datepicker-tab" data-from="{from}" data-to="{to}">{label}</span>';
        this.tablist = [];
        var tabs = this.settings.tabs;
        if(tabs === true) {
            tabs = [
        		{label: "今天", from: "%TODAY", to: "%TODAY", active: true},
        		{label: "近3天", from: "%TODAY-2", to: "%TODAY"},
        		{label: "近7天", from: "%TODAY-6", to: "%TODAY"}
            ];
            /* tabs = [
                {label: '本周', range: 'TWEEK', active: true},
                {label: '本月',  range: 'TMONTH'},
                {label: '本季度',  range: 'TQUARTER'}
            ] */
        }
        var initVal; //初始选中值
        _.each(tabs, function(tab) {
            var item = this._resolveTab(tab);
            if(!initVal && item.active === true) {//初始选中值
                initVal = {};
                initVal[this.settings.startKey] = item.from;
                initVal[this.settings.endKey] = item.to;
            }
            this.tablist.push(item);
        }, this);
        _.each(this.tablist, function(tab) {
            tabsHtml += objformat(tabTpl, tab);
        }, this);
        this.el.find('.esys-datepicker-tablist').prepend(tabsHtml);
        if(initVal) {
            this.setValue(initVal);
        }
    }
    //更新快速选择的选中状态
    DateRangePicker.prototype._updateTabsStatus = function (v) {
        if(!v) v = this.datepicker.getValue();
        if(!_.isUndefined(v) && _.isObject(v)) {
            var from = v[this.settings.startKey],
                to = v[this.settings.endKey],
                selectIndex = -1;
            _.each(this.tablist, function(tab, i) {
                if(tab.from === from && tab.to === to) {//选中项
                    this.el.find('.esys-datepicker-tab').eq(i).addClass('current').siblings().removeClass('current');
                    selectIndex = i;
                    return false;
                }
            }, this);
            if(selectIndex === -1) {//快速选择无匹配项，清除原来的选中项
                this.el.find('.esys-datepicker-tab.current').removeClass('current');
            }
        }
    }
    //隐藏域设值
    DateRangePicker.prototype._setInputValue = function (v) {
        if(!v) v = this.datepicker.getValue();
        var from = v[this.settings.startKey],
            to = v[this.settings.endKey];
        this.el.find('input:hidden[name=' + this.settings.startKey + ']').val(from);
        this.el.find('input:hidden[name=' + this.settings.endKey + ']').val(to);
    }

    DateRangePicker.prototype._bindEvents = function () {
        var _this = this;
        this.el.find('.esys-datepicker-tab').click(function() {
            if(!$(this).hasClass('current')) {
                var from = $(this).attr('data-from'),
                    to = $(this).attr('data-to');
                var v = {};
                v[_this.settings.startKey] = from;
                v[_this.settings.endKey] = to;
                _this.datepicker.setValue(v);
                $(this).addClass('current').siblings('.esys-datepicker-tab').removeClass('current');
            }
        });
        this.datepicker.startEle.on('changeDate', function() {
            _this._updateTabsStatus();
            _this._setInputValue();
        });
        this.datepicker.endEle.on('changeDate', function() {
            _this._updateTabsStatus();
            _this._setInputValue();
        });
        this.datepicker.startEle.on('clearDate', function() {
            _this.el.find('.esys-datepicker-tab').removeClass('current');
            _this._setInputValue();
        });
        this.datepicker.endEle.on('clearDate', function() {
            _this.el.find('.esys-datepicker-tab').removeClass('current');
            _this._setInputValue();
        });
    }

    module.exports = DateRangePicker;
});