'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CProductsListItemModel = require('modules/%ModuleName%/js/models/CProductsListItemModel.js'),
	CProductGroupsListItemModel = require('modules/%ModuleName%/js/models/CProductGroupsListItemModel.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	ModuleErrors = require('%PathToCoreWebclientModule%/js/ModuleErrors.js')
;

/**
 * View that is used as screen of sales module.
 * 
 * @constructor
 */
function CMainView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.oSalesView = require('modules/%ModuleName%/js/views/SalesView.js');
	
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
	this.isUpdatingSale = ko.observable(false);
	this.selectedSalesItem.subscribe(_.bind(function () {
		this.isUpdatingSale(false);
	}, this));

	//Products
	this.productsList = ko.observableArray([]);
	this.productsCount = ko.observable(0);
	this.productsFullList = ko.observableArray([]);
	this.selectedProductsItem = ko.observable(null);
	this.isProductsSearchFocused = ko.observable(false);
	this.newProductsSearchInput = ko.observable('');
	this.productsSearchInput = ko.observable('');
	this.productsSearchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.productsSearchInput(),
			'COUNT': this.productsCount()
		});
	}, this);
	this.productsSelector = new CSelector(
		this.productsList,
		_.bind(this.viewProductsItem, this)
	);
	this.isProductsSearch = ko.computed(function () {
		return this.productsSearchInput() !== '';
	}, this);
	this.currentProductsPage = ko.observable(1);
	this.oProductsPageSwitcher = new CPageSwitcherView(0, this.iItemsPerPage);
	this.oProductsPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentProductsPage(iCurrentpage);
		this.requestProductsList();
	}, this);
	this.loadingProductsList = ko.observable(false);
	this.isProductsVisible = ko.observable(false);
	this.isUpdatingProduct = ko.observable(false);
	this.saveProduct = _.bind(this.saveProduct, this);
	this.removeProductBinded = _.bind(this.removeProduct, this);
	this.selectedProductsItem.subscribe(_.bind(function () {
		this.isUpdatingProduct(false);
	}, this));
	
	//Product Groups
	this.productGroupsList = ko.observableArray([]);
	this.productGroupsCount = ko.observable(0);
	this.productGroupsFullList = ko.observableArray([]);
	this.selectedProductGroupsItem = ko.observable(null);
	this.isProductGroupsSearchFocused = ko.observable(false);
	this.newProductGroupsSearchInput = ko.observable('');
	this.productGroupsSearchInput = ko.observable('');
	this.productGroupsSearchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.productGroupsSearchInput(),
			'COUNT': this.productGroupsCount()
		});
	}, this);
	this.productGroupsSelector = new CSelector(
		this.productGroupsList,
		_.bind(this.viewProductGroupsItem, this)
	);
	this.isProductGroupsSearch = ko.computed(function () {
		return this.productGroupsSearchInput() !== '';
	}, this);
	this.currentProductGroupsPage = ko.observable(1);
	this.oProductGroupsPageSwitcher = new CPageSwitcherView(0, this.iItemsPerPage);
	this.oProductGroupsPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentProductGroupsPage(iCurrentpage);
		this.requestProductGroupsList();
	}, this);
	this.loadingProductGroupsList = ko.observable(false);
	this.isProductGroupsVisible = ko.observable(false);
	this.isUpdatingProductGroup = ko.observable(false);
	this.saveProductGroup = _.bind(this.saveProductGroup, this);
	this.removeProductGroupBinded = _.bind(this.removeProductGroup, this);
	this.selectedProductGroupsItem.subscribe(_.bind(function () {
		this.isUpdatingProductGroup(false);
	}, this));
	
	this.selectedStorage = ko.observable(Enums.SalesStorages.Sales);
	this.bigButtonText = ko.computed(function () {
		switch (this.selectedStorage())
		{
			case Enums.SalesStorages.Products:
				return 'New Product';
			case Enums.SalesStorages.ProductGroups:
				return 'New Group';
		}
		return '';
	}, this);
	this.bigButtonCommand = Utils.createCommand(this, function () {
		switch (this.selectedStorage())
		{
			case Enums.SalesStorages.Products:
				this.selectedProductsItem(new CProductsListItemModel());
				this.productsSelector.itemSelected(null);
				break;
			case Enums.SalesStorages.ProductGroups:
				this.selectedProductGroupsItem(new CProductGroupsListItemModel());
				this.productGroupsSelector.itemSelected(null);
				break;
		}
	});
	
	this.aObjectTabs = [
		{
			sType: Enums.SalesStorages.Sales,
			sText: TextUtils.i18n('%MODULENAME%/ACTION_SHOW_SALES_LIST')
		},
		{
			sType: Enums.SalesStorages.Products,
			sText: TextUtils.i18n('%MODULENAME%/ACTION_SHOW_PRODUCTS_LIST')
		},
		{
			sType: Enums.SalesStorages.ProductGroups,
			sText: TextUtils.i18n('%MODULENAME%/ACTION_SHOW_PRODUCT_GROUPS_LIST')
		}
	];
}

_.extendOwn(CMainView.prototype, CAbstractScreenView.prototype);

CMainView.prototype.ViewTemplate = '%ModuleName%_MainView';
CMainView.prototype.ViewConstructorName = 'CMainView';


CMainView.prototype.showObjects = function (sType)
{
	switch (sType)
	{
		case Enums.SalesStorages.Sales:
			this.oSalesView.show();
			this.isProductsVisible(false);
			this.isProductGroupsVisible(false);
			this.selectedStorage(Enums.SalesStorages.Sales);
			break;
		case Enums.SalesStorages.Products:
			this.oSalesView.hide();
			this.isProductsVisible(true);
			this.isProductGroupsVisible(false);
			this.selectedStorage(Enums.SalesStorages.Products);
			break;
		case Enums.SalesStorages.ProductGroups:
			this.oSalesView.hide();
			this.isProductGroupsVisible(true);
			this.isProductsVisible(false);
			this.selectedStorage(Enums.SalesStorages.ProductGroups);
			break;
	}
};

/**
 * Called every time when screen is shown.
 */
CMainView.prototype.onShow = function ()
{
	this.oSalesView.onShow();
	this.requestProductsFullList();
	this.requestProductGroupsFullList();
};

CMainView.prototype.onBind = function ()
{
	this.oSalesView.onBind();
	this.productsSelector.initOnApplyBindings(
		'.products_sub_list .item',
		'.products_sub_list .selected.item',
		$('.products_list', this.$viewDom),
		$('.products_list_scroll.scroll-inner', this.$viewDom)
	);
	this.productGroupsSelector.initOnApplyBindings(
		'.product_groups_sub_list .item',
		'.product_groups_sub_list .selected.item',
		$('.product_groups_list', this.$viewDom),
		$('.product_groups_list_scroll.scroll-inner', this.$viewDom)
	);
};

//Products
CMainView.prototype.requestProductsList = function ()
{
	this.loadingProductsList(true);
	this.productsSearchInput(this.newProductsSearchInput());
	Ajax.send(
		'Sales',
		'GetProducts', 
		{
			'Offset': (this.currentProductsPage() - 1) * this.iItemsPerPage,
			'Limit': this.iItemsPerPage,
			'Search': this.productsSearchInput()
		},
		this.onGetProductsResponse,
		this
	);
};

CMainView.prototype.requestProductsFullList = function ()
{
	this.loadingProductsList(true);
	Ajax.send(
		'Sales',
		'GetProducts', 
		{},
		this.onGetProductsFullListResponse,
		this
	);
};

CMainView.prototype.requestProductGroupsFullList = function ()
{
	this.loadingProductGroupsList(true);
	Ajax.send(
		'Sales',
		'GetProductGroups', 
		{},
		this.onGetProductGroupsFullListResponse,
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
				}))
		;
		this.productsList(aNewCollection);
		this.productsCount(iItemsCount);
		this.oProductsPageSwitcher.setCount(iItemsCount);
		this.loadingProductsList(false);
//		this.productsSelector.itemSelected(this.selectedProductsItem());
	}
};

CMainView.prototype.onGetProductsFullListResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			aNewProductsCollection = _.compact(_.map(oResult.Products, function (oItemData) {
				var oItem = new CProductsListItemModel();
				oItem.parse(oItemData);
				return oItem;
			})),
			oEmptyItem = new CProductsListItemModel()
		;
		this.oProductsPageSwitcher.setCount(iItemsCount);
		if (this.productsList().length < 1)
		{
			this.productsList(aNewProductsCollection.slice(0, this.iItemsPerPage));
		}
		this.loadingProductsList(false);
		oEmptyItem.id = 0;
		oEmptyItem.sProductTitle = "-";
		aNewProductsCollection.unshift(oEmptyItem);
		this.productsFullList(aNewProductsCollection);
	}
};

CMainView.prototype.onGetProductGroupsFullListResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			aNewProductGroupsCollection = _.compact(_.map(oResult.ProductGroups, function (oItemData) {
				var oItem = new CProductGroupsListItemModel();
				oItem.parse(oItemData);
				return oItem;
			})),
			oEmptyGroupItem = new CProductGroupsListItemModel()
		;
		this.oProductGroupsPageSwitcher.setCount(iItemsCount);
		if (this.productGroupsList().length < 1)
		{
			this.productGroupsList(aNewProductGroupsCollection.slice(0, this.iItemsPerPage));
		}
		this.loadingProductGroupsList(false);
		oEmptyGroupItem.id = 0;
		oEmptyGroupItem.UUID = "";
		oEmptyGroupItem.sTitle = "-";
		aNewProductGroupsCollection.unshift(oEmptyGroupItem);
		this.productGroupsFullList(aNewProductGroupsCollection);
	}
};

CMainView.prototype.viewProductsItem = function (oItem)
{
	this.selectedProductsItem(oItem);
};

CMainView.prototype.onClearProductsSearchClick = function ()
{
	// initiation empty search
	this.newProductsSearchInput('');
	this.productsSearchInput('');
	this.productsSearchSubmit();
};

CMainView.prototype.productsSearchSubmit = function ()
{
	this.oProductsPageSwitcher.currentPage(1);
	this.requestProductsList();
};

CMainView.prototype.saveProduct = function ()
{
	var
		oProduct = this.selectedProductsItem(),
		oParameters = oProduct ? {
			'Title': oProduct.sProductTitle,
			'ProductGroupUUID': oProduct.sProductGroupUUID,
			'ShareItProductId': oProduct.iShareItProductId,
			'PayPalItem': oProduct.sPayPalItem,
			'ProductPrice': oProduct.iProductPrice,
			'Homepage': oProduct.sHomepage
		} : null,
		sMethod = oProduct && oProduct.UUID === '' ? 'CreateProduct' : 'UpdateProduct'
	;
	
	if (oProduct)
	{
		if (oProduct.sProductTitle === '')
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_INPUT'));
		}
		else
		{
			if (oProduct.UUID !== '')
			{
				oParameters.ProductId = oProduct.id;
			}
			this.isUpdatingProduct(true);
			Ajax.send('Sales', sMethod, oParameters, this.onGetProductUpdateResponse, this);
		}
	}
};

CMainView.prototype.onGetProductUpdateResponse = function (oResponse)
{
	this.isUpdatingProduct(false);

	if (oResponse.Result)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
	}
	
	this.requestProductsFullList();
	this.requestProductsList();
	this.requestSalesList();
};

CMainView.prototype.removeProduct = function (oProduct)
{
	Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_PRODUCT'),  _.bind(function(bConfirm) {
		if (bConfirm)
		{
			Ajax.send(
				'Sales',
				'DeleteProduct',
				{'IdOrUUID': oProduct.UUID},
				this.onProductDeleteResponse, 
				this
			);
		}
	}, this), oProduct.sProductTitle]);
};

CMainView.prototype.onProductDeleteResponse = function (oResponse)
{
	var sMessage = '';
	if (!oResponse.Result)
	{
		sMessage = ModuleErrors.getErrorMessage(oResponse);
		if (sMessage)
		{
			Screens.showError(sMessage);
		}
		else
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_REMOVE_PROCESS'));
		}
	}
	else
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REMOVE_PRODUCT_SUCCESS'));
		this.requestProductsFullList();
		this.requestProductsList();
		this.selectedProductsItem(null);
	}
};

//Product groups
CMainView.prototype.requestProductGroupsList = function ()
{
	this.loadingProductGroupsList(true);
	this.productGroupsSearchInput(this.newProductGroupsSearchInput());
	Ajax.send(
		'Sales',
		'GetProductGroups', 
		{
			'Offset': (this.currentProductGroupsPage() - 1) * this.iItemsPerPage,
			'Limit': this.iItemsPerPage,
			'Search': this.productGroupsSearchInput()
		},
		this.onGetProductGroupsResponse,
		this
	);
};

CMainView.prototype.onGetProductGroupsResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			aNewCollection = _.compact(_.map(oResult.ProductGroups, function (oItemData) {
					var oItem = new CProductGroupsListItemModel();
					oItem.parse(oItemData);
					return oItem;
				}));
		this.productGroupsList(aNewCollection);
		this.productGroupsCount(iItemsCount);
		this.oProductGroupsPageSwitcher.setCount(iItemsCount);
		this.loadingProductGroupsList(false);
	}
};

CMainView.prototype.viewProductGroupsItem = function (oItem)
{
	this.selectedProductGroupsItem(oItem);
};

CMainView.prototype.onClearProductGroupsSearchClick = function ()
{
	// initiation empty search
	this.newProductGroupsSearchInput('');
	this.productGroupsSearchInput('');
	this.productGroupsSearchSubmit();
};

CMainView.prototype.productGroupsSearchSubmit = function ()
{
	this.oProductGroupsPageSwitcher.currentPage(1);
	this.requestProductGroupsList();
};

CMainView.prototype.saveProductGroup = function ()
{
	var
		oProductGroup = this.selectedProductGroupsItem(),
		oParameters = oProductGroup ? {
			'ProductGroupId': oProductGroup.id,
			'Title': oProductGroup.sTitle,
			'Homepage': oProductGroup.sHomepage,
			'ProductCode': oProductGroup.sProductCode
		} : null,
		sMethod = oProductGroup && oProductGroup.UUID === '' ? 'CreateProductGroup' : 'UpdateProductGroup'
	;
	
	if (oProductGroup)
	{
		if (oProductGroup.sTitle === '')
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_INPUT'));
		}
		else
		{
			if (oProductGroup.UUID !== '')
			{
				oParameters.ProductId = oProductGroup.id;
			}
			this.isUpdatingProductGroup(true);
			Ajax.send('Sales', sMethod, oParameters, this.onGetProductGroupUpdateResponse, this);
		}
	}
};

CMainView.prototype.onGetProductGroupUpdateResponse = function (oResponse)
{
	this.isUpdatingProductGroup(false);

	if (oResponse.Result)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
		this.selectedProductGroupsItem(null);
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
	}
	
	this.requestProductGroupsFullList();
	this.requestProductGroupsList();
};

CMainView.prototype.removeProductGroup = function (oProductGroup)
{
	Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_PRODUCT_GROUP'),  _.bind(function(bConfirm) {
		if (bConfirm)
		{
			Ajax.send(
				'Sales',
				'DeleteProductGroup',
				{'IdOrUUID': oProductGroup.UUID},
				this.onProductGroupDeleteResponse, 
				this
			);
		}
	}, this), oProductGroup.sTitle]);
};

CMainView.prototype.onProductGroupDeleteResponse = function (oResponse)
{
	var sMessage = '';
	if (!oResponse.Result)
	{
		sMessage = ModuleErrors.getErrorMessage(oResponse);
		if (sMessage)
		{
			Screens.showError(sMessage);
		}
		else
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_REMOVE_PROCESS'));
		}
	}
	else
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REMOVE_PRODUCT_GROUP_SUCCESS'));
		this.requestProductGroupsFullList();
		this.requestProductGroupsList();
		this.selectedProductGroupsItem(null);
	}
};

module.exports = new CMainView();
