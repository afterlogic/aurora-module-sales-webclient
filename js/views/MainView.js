'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CSalesListItemModel = require('modules/%ModuleName%/js/models/CSalesListItemModel.js'),
	CLicensesListItemModel = require('modules/%ModuleName%/js/models/CLicensesListItemModel.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
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
	this.licensesList = ko.observableArray([]);
	this.licensesFullList = ko.observableArray([]);
	this.selectedSalesItem = ko.observable(null);
	this.selectedLicensesItem = ko.observable(null);
	this.isSalesSearchFocused = ko.observable(false);
	this.isLicensesSearchFocused = ko.observable(false);
	this.salesSearchInput = ko.observable('');
	this.licensesSearchInput = ko.observable('');
	
	this.salesSelector = new CSelector(
		this.salesList,
		_.bind(this.viewSalesItem, this)
	);
	
	this.licensesSelector = new CSelector(
		this.licensesList,
		_.bind(this.viewLicensesItem, this)
	);
	
	this.isSalesSearch = ko.computed(function () {
		return this.salesSearchInput() !== '';
	}, this);
	
	this.isLicensesSearch = ko.computed(function () {
		return this.licensesSearchInput() !== '';
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
	
	this.currentLicensesPage = ko.observable(1);
	this.oLicensesPageSwitcher = new CPageSwitcherView(0, this.iItemsPerPage);
	this.oLicensesPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentLicensesPage(iCurrentpage);
		this.requestLicensesList();
	}, this);
	this.loadingLicensesList = ko.observable(false);
	this.isLicensesVisible = ko.observable(false);
	this.isUpdatingLicense = ko.observable(false);
	this.saveLicense = _.bind(this.saveLicense, this);
	this.selectedLicensesItem.subscribe(_.bind(function () {
		this.isUpdatingLicense(false);
	}, this));
	
	this.selectedStorage = ko.observable('sales');
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
	this.requestLicensesList();
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
					oItem.parse(oItemData, oResult.Customers, oResult.Licenses);
					return oItem;
				})) : [],
			aNewLicensesCollection = _.compact(_.map(oResult.Licenses, function (oItemData) {
				var oItem = new CLicensesListItemModel();
				oItem.parse(oItemData);
				return oItem;
			})),
			oEmptyItem = new CLicensesListItemModel()
		;
		this.salesList(aNewCollection);
		this.oSalesPageSwitcher.setCount(iItemsCount);
		oEmptyItem.id = 0;
		oEmptyItem.sLicenseName = "-";
		aNewLicensesCollection.unshift(oEmptyItem);
		this.licensesFullList(aNewLicensesCollection);
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
	this.licensesSelector.initOnApplyBindings(
		'.licenses_sub_list .item',
		'.licenses_sub_list .selected.item',
		$('.licenses_list', this.$viewDom),
		$('.licenses_list_scroll.scroll-inner', this.$viewDom)
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
	this.isLicensesVisible(false);
	this.isSalesVisible(true);
	this.selectedStorage('sales');
};

CMainView.prototype.saveSale = function ()
{
	this.isUpdatingSale(true);
	if (this.selectedSalesItem().id === 0 || this.selectedSalesItem().iLicenseId === 0)
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
				'LicenseId': this.selectedSalesItem().iLicenseId
			},
			this.onGetSaleUpdateResponse,
			this
		);
	}
};

CMainView.prototype.onGetSaleUpdateResponse = function (oResponse)
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
	this.requestLicensesList();
	this.requestSalesList();
}

CMainView.prototype.requestLicensesList = function ()
{
	this.loadingLicensesList(true);
	Ajax.send(
		'Sales',
		'GetLicenses', 
		{
			'Offset': (this.currentLicensesPage() - 1) * this.iItemsPerPage,
			'Limit': this.iItemsPerPage,
			'Search': this.licensesSearchInput(),
		},
		this.onGetLicensesResponse,
		this
	);
};

CMainView.prototype.onGetLicensesResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			aNewCollection = _.compact(_.map(oResult.Licenses, function (oItemData) {
					var oItem = new CLicensesListItemModel();
					oItem.parse(oItemData);
					return oItem;
				}));
		this.licensesList(aNewCollection);
		this.oLicensesPageSwitcher.setCount(iItemsCount);
		this.loadingLicensesList(false);
//		this.licensesSelector.itemSelected(this.selectedLicensesItem());
	}
};

CMainView.prototype.viewLicensesItem = function (oItem)
{
	this.selectedLicensesItem(oItem);
};

CMainView.prototype.showLicenses = function ()
{
	this.isLicensesVisible(true);
	this.isSalesVisible(false);
	this.selectedStorage('licenses');
};

CMainView.prototype.onClearLicensesSearchClick = function ()
{
	// initiation empty search
	this.licensesSearchInput('');
	this.licensesSearchSubmit();
};

CMainView.prototype.licensesSearchSubmit = function ()
{
	this.oLicensesPageSwitcher.currentPage(1);
	this.requestLicensesList();
};

CMainView.prototype.saveLicense = function ()
{
	this.isUpdatingLicense(true);
	if (this.selectedLicensesItem().id === 0 || this.selectedLicensesItem().sLicenseName === "")
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_INPUT'));
	}
	else
	{
		Ajax.send(
			'Sales',
			'UpdateLicense', 
			{
				'LicenseId': this.selectedLicensesItem().id,
				'Name': this.selectedLicensesItem().sLicenseName,
				'LicenseCode': this.selectedLicensesItem().iLicenseCode,
				'ShareItLicenseId': this.selectedLicensesItem().iShareItLicenseId,
				'PayPalItem': this.selectedLicensesItem().sPayPalItem
			},
			this.onGetLicenseUpdateResponse,
			this
		);
	}
};

CMainView.prototype.onGetLicenseUpdateResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	this.isUpdatingLicense(false);

	if (oResult)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
	}
	this.requestLicensesList();
	this.requestSalesList();
}
module.exports = new CMainView();
