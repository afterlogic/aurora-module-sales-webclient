'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CSalesListItemModel = require('modules/%ModuleName%/js/models/CSalesListItemModel.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * View that is used as screen of sales module.
 * 
 * @constructor
 */
function CMainView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	var iItemsPerPage = 20;
	/**
	 * Text for displaying in browser title when sales screen is shown.
	 */
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
	this.salesList = ko.observableArray([]);
	this.selectedItem = ko.observable(null);
	
	this.selector = new CSelector(
		this.salesList,
		_.bind(this.viewItem, this)
	);
	
	this.pageSwitcherLocked = ko.observable(false);
	this.oPageSwitcher = new CPageSwitcherView(0, iItemsPerPage);
	this.currentPage = ko.observable(1);
}

_.extendOwn(CMainView.prototype, CAbstractScreenView.prototype);

CMainView.prototype.ViewTemplate = '%ModuleName%_MainView';
CMainView.prototype.ViewConstructorName = 'CMainView';


/**
 * Called every time when screen is shown.
 */
CMainView.prototype.onShow = function ()
{
	this.requestSalesList();
};

CMainView.prototype.requestSalesList = function ()
{
	Ajax.send(
		'Sales',
		'GetSales', 
		{},
		this.onGetSalesResponse,
		this
	);
};

CMainView.prototype.onGetSalesResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			aNewCollection = Types.isNonEmptyArray(oResult.List) ? _.compact(_.map(oResult.List, function (oItemData) {
				var oItem = new CSalesListItemModel();
				oItem.parse(oItemData);
				return oItem;
			})) : [];
		this.salesList(aNewCollection);
		this.oPageSwitcher.setCount(iItemsCount);
	}
};

CMainView.prototype.viewItem = function (oItem)
{
	this.selectedItem(oItem);
};

CMainView.prototype.onBind = function ()
{
	this.selector.initOnApplyBindings(
		'.sales_sub_list .item',
		'.sales_sub_list .selected.item',
		$('.sales_list', this.$viewDom),
		$('.sales_list_scroll.scroll-inner', this.$viewDom)
	);
};

module.exports = new CMainView();
