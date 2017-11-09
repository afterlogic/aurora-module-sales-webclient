'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CSalesListItemModel = require('modules/%ModuleName%/js/models/CSalesListItemModel.js'),
	CProductsListItemModel = require('modules/%ModuleName%/js/models/CProductsListItemModel.js'),
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
	this.iItemsPerPage = 20;
	/**
	 * Text for displaying in browser title when sales screen is shown.
	 */
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
	this.salesList = ko.observableArray([]);
	this.productsList = ko.observableArray([]);
	this.selectedSalesItem = ko.observable(null);
	this.selectedProductsItem = ko.observable(null);
	this.isSalesSearchFocused = ko.observable(false);
	this.isProductsSearchFocused = ko.observable(false);
	this.salesSearchInput = ko.observable('');
	this.productsSearchInput = ko.observable('');
	
	this.salesSelector = new CSelector(
		this.salesList,
		_.bind(this.viewSalesItem, this)
	);
	
	this.productsSelector = new CSelector(
		this.productsList,
		_.bind(this.viewProductsItem, this)
	);
	
	this.isSalesSearch = ko.computed(function () {
		return this.salesSearchInput() !== '';
	}, this);
	
	this.isProductsSearch = ko.computed(function () {
		return this.productsSearchInput() !== '';
	}, this);
	
	this.currentSalesPage = ko.observable(1);
	this.oSalesPageSwitcher = new CPageSwitcherView(0, this.iItemsPerPage);
	this.oSalesPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentSalesPage(iCurrentpage);
		this.requestSalesList();
	}, this);
	this.loadingSalesList = ko.observable(false);
	this.isSalesVisible =  ko.observable(true);
	
	this.currentProductsPage = ko.observable(1);
	this.oProductsPageSwitcher = new CPageSwitcherView(0, this.iItemsPerPage);
	this.oProductsPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentProductsPage(iCurrentpage);
		this.requestProductsList();
	}, this);
	this.loadingProductsList = ko.observable(false);
	this.isProductsVisible = ko.observable(false);
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
	this.requestProductsList();
};

CMainView.prototype.requestSalesList = function ()
{
	this.loadingSalesList(true);
	Ajax.send(
		'Sales',
		'GetSales', 
		{
			'Offset': (this.currentSalesPage() - 1) * this.iItemsPerPage,
			'Limit': this.iItemsPerPage,
			'Search': this.salesSearchInput(),
		},
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
			aNewCollection = Types.isNonEmptyArray(oResult.Sales) ? _.compact(_.map(oResult.Sales, function (oItemData) {
					var oItem = new CSalesListItemModel();
					oItem.parse(oItemData, oResult.Customers, oResult.Products);
					return oItem;
				})) : [];
		this.salesList(aNewCollection);
		this.oSalesPageSwitcher.setCount(iItemsCount);
		this.loadingSalesList(false);
	}
};

CMainView.prototype.viewSalesItem = function (oItem)
{
	this.selectedSalesItem(oItem);
};

CMainView.prototype.onBind = function ()
{
	this.salesSelector.initOnApplyBindings(
		'.sales_sub_list .item',
		'.sales_sub_list .selected.item',
		$('.sales_list', this.$viewDom),
		$('.sales_list_scroll.scroll-inner', this.$viewDom)
	);
	this.productsSelector.initOnApplyBindings(
		'.products_sub_list .item',
		'.products_sub_list .selected.item',
		$('.products_list', this.$viewDom),
		$('.products_list_scroll.scroll-inner', this.$viewDom)
	);
};

CMainView.prototype.salesSearchSubmit = function ()
{
	this.oSalesPageSwitcher.currentPage(1);
	this.requestSalesList();
};

CMainView.prototype.onClearSalesSearchClick = function ()
{
	// initiation empty search
	this.salesSearchInput('');
	this.salesSearchSubmit();
};

CMainView.prototype.showSales = function ()
{
	this.isProductsVisible(false);
	this.isSalesVisible(true);
};

CMainView.prototype.requestProductsList = function ()
{
	this.loadingProductsList(true);
	Ajax.send(
		'Sales',
		'GetProducts', 
		{
			'Offset': (this.currentProductsPage() - 1) * this.iItemsPerPage,
			'Limit': this.iItemsPerPage,
			'Search': this.productsSearchInput(),
		},
		this.onGetProductsResponse,
		this
	);
};

CMainView.prototype.onGetProductsResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			aNewCollection = _.compact(_.map(oResult.Products, function (oItemData) {
					var oItem = new CProductsListItemModel();
					oItem.parse(oItemData);
					return oItem;
				}));
		this.productsList(aNewCollection);
		this.oProductsPageSwitcher.setCount(iItemsCount);
		this.loadingProductsList(false);
	}
};

CMainView.prototype.viewProductsItem = function (oItem)
{
	this.selectedProductsItem(oItem);
};

CMainView.prototype.showProducts = function ()
{
	this.isProductsVisible(true);
	this.isSalesVisible(false);
};

CMainView.prototype.onClearProductsSearchClick = function ()
{
	// initiation empty search
	this.productsSearchInput('');
	this.productsSearchSubmit();
};

CMainView.prototype.productsSearchSubmit = function ()
{
	this.oProductsPageSwitcher.currentPage(1);
	this.requestProductsList();
};

module.exports = new CMainView();
