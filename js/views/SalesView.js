'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	CSalesListItemModel = require('modules/%ModuleName%/js/models/CSalesListItemModel.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * View that is used as screen of sales module.
 * 
 * @constructor
 */
function CSalesView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.objectList = ko.observableArray([]);
	this.objectsCount = ko.observable(0);
	this.selectedObject = ko.observable(null);
	this.searchFocused = ko.observable(false);
	this.searchInputValue = ko.observable('');
	this.searchValue = ko.observable('');
	this.searchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.searchValue(),
			'COUNT': this.objectsCount()
		});
	}, this);
	this.oSelector = new CSelector(
		this.objectList,
		_.bind(this.viewSalesItem, this)
	);
	this.isSearch = ko.computed(function () {
		return this.searchValue() !== '';
	}, this);
	this.currentPage = ko.observable(1);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ItemsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentPage(iCurrentpage);
		this.requestSalesList();
	}, this);
	this.listLoading = ko.observable(false);
	this.isVisible =  ko.observable(true);
	this.isUpdating = ko.observable(false);
	this.saveSale = _.bind(this.saveSale, this);
	this.selectedObject.subscribe(_.bind(function () {
		this.isUpdating(false);
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
	this.listLoading(true);
	this.searchValue(this.searchInputValue());
	Ajax.send(
		'Sales',
		'GetSales', 
		{
			'Offset': (this.currentPage() - 1) * Settings.ItemsPerPage,
			'Limit': Settings.ItemsPerPage,
			'Search': this.searchValue()
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
		this.objectList(aNewCollection);
		this.objectsCount(iItemsCount);
		this.oPageSwitcher.setCount(iItemsCount);
		this.listLoading(false);
	}
};

CSalesView.prototype.viewSalesItem = function (oItem)
{
	this.selectedObject(oItem);
};

CSalesView.prototype.onBind = function ()
{
	this.oSelector.initOnApplyBindings(
		'.sales_sub_list .item',
		'.sales_sub_list .selected.item',
		$('.sales_list', this.$viewDom),
		$('.sales_list_scroll.scroll-inner', this.$viewDom)
	);
};

CSalesView.prototype.salesSearchSubmit = function ()
{
	this.oPageSwitcher.currentPage(1);
	this.requestSalesList();
};

CSalesView.prototype.onClearSalesSearchClick = function ()
{
	// initiation empty search
	this.searchInputValue('');
	this.searchValue('');
	this.salesSearchSubmit();
};

CSalesView.prototype.show = function ()
{
	this.isVisible(true);
};

CSalesView.prototype.hide = function ()
{
	this.isVisible(false);
};

CSalesView.prototype.saveSale = function ()
{
	this.isUpdating(true);
	if (this.selectedObject().id === 0 || this.selectedObject().iProductId === 0)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_INPUT'));
	}
	else
	{
		Ajax.send(
			'Sales',
			'UpdateSale', 
			{
				'SaleId': this.selectedObject().id,
				'ProductId': this.selectedObject().iProductId
			},
			this.onGetSaleUpdateResponse,
			this
		);
	}
};

CSalesView.prototype.onGetSaleUpdateResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	this.isUpdating(false);

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
