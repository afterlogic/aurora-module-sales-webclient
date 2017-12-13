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
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * View that is used as screen of sales module.
 * 
 * @constructor
 */
function CSalesView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	this.iItemsPerPage = 20;
	/**
	 * Text for displaying in browser title when sales screen is shown.
	 */
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
	//Sales
	this.salesList = ko.observableArray([]);
	this.salesCount = ko.observable(0);
	this.selectedSalesItem = ko.observable(null);
	this.isSalesSearchFocused = ko.observable(false);
	this.newSalesSearchInput = ko.observable('');
	this.salesSearchInput = ko.observable('');
	this.salesSearchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.salesSearchInput(),
			'COUNT': this.salesCount()
		});
	}, this);
	this.salesSelector = new CSelector(
		this.salesList,
		_.bind(this.viewSalesItem, this)
	);
	this.isSalesSearch = ko.computed(function () {
		return this.salesSearchInput() !== '';
	}, this);
	this.currentSalesPage = ko.observable(1);
	this.oSalesPageSwitcher = new CPageSwitcherView(0, this.iItemsPerPage);
	this.oSalesPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentSalesPage(iCurrentpage);
		this.requestSalesList();
	}, this);
	this.loadingSalesList = ko.observable(false);
	this.isSalesVisible =  ko.observable(true);
	this.isUpdatingSale = ko.observable(false);
	this.saveSale = _.bind(this.saveSale, this);
	this.selectedSalesItem.subscribe(_.bind(function () {
		this.isUpdatingSale(false);
	}, this));
}

_.extendOwn(CSalesView.prototype, CAbstractScreenView.prototype);

CSalesView.prototype.ViewTemplate = '%ModuleName%_SalesView';
CSalesView.prototype.EditViewTemplate = '%ModuleName%_SalesEditView';
CSalesView.prototype.ViewConstructorName = 'CSalesView';

/**
 * Called every time when screen is shown.
 */
CSalesView.prototype.onShow = function ()
{
	this.requestSalesList();
};

CSalesView.prototype.requestSalesList = function ()
{
	this.loadingSalesList(true);
	this.salesSearchInput(this.newSalesSearchInput());
	Ajax.send(
		'Sales',
		'GetSales', 
		{
			'Offset': (this.currentSalesPage() - 1) * this.iItemsPerPage,
			'Limit': this.iItemsPerPage,
			'Search': this.salesSearchInput()
		},
		this.onGetSalesResponse,
		this
	);
};

CSalesView.prototype.onGetSalesResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			aNewCollection = Types.isNonEmptyArray(oResult.Sales) ? _.compact(_.map(oResult.Sales, function (oItemData) {
					var oItem = new CSalesListItemModel();
					oItem.parse(oItemData, oResult.Customers, oResult.Products);
					return oItem;
				})) : []
		;
		this.salesList(aNewCollection);
		this.salesCount(iItemsCount);
		this.oSalesPageSwitcher.setCount(iItemsCount);
		this.loadingSalesList(false);
	}
};

CSalesView.prototype.viewSalesItem = function (oItem)
{
	this.selectedSalesItem(oItem);
};

CSalesView.prototype.onBind = function ()
{
	this.salesSelector.initOnApplyBindings(
		'.sales_sub_list .item',
		'.sales_sub_list .selected.item',
		$('.sales_list', this.$viewDom),
		$('.sales_list_scroll.scroll-inner', this.$viewDom)
	);
};

CSalesView.prototype.salesSearchSubmit = function ()
{
	this.oSalesPageSwitcher.currentPage(1);
	this.requestSalesList();
};

CSalesView.prototype.onClearSalesSearchClick = function ()
{
	// initiation empty search
	this.newSalesSearchInput('');
	this.salesSearchInput('');
	this.salesSearchSubmit();
};

CSalesView.prototype.show = function ()
{
	this.isSalesVisible(true);
};

CSalesView.prototype.hide = function ()
{
	this.isSalesVisible(false);
};

CSalesView.prototype.saveSale = function ()
{
	this.isUpdatingSale(true);
	if (this.selectedSalesItem().id === 0 || this.selectedSalesItem().iProductId === 0)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_INPUT'));
	}
	else
	{
		Ajax.send(
			'Sales',
			'UpdateSale', 
			{
				'SaleId': this.selectedSalesItem().id,
				'ProductId': this.selectedSalesItem().iProductId
			},
			this.onGetSaleUpdateResponse,
			this
		);
	}
};

CSalesView.prototype.onGetSaleUpdateResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	this.isUpdatingSale(false);

	if (oResult)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
	}
	this.requestProductsList();
	this.requestSalesList();
};

module.exports = new CSalesView();
