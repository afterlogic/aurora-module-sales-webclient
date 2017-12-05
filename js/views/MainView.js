'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CSalesListItemModel = require('modules/%ModuleName%/js/models/CSalesListItemModel.js'),
	CProductsListItemModel = require('modules/%ModuleName%/js/models/CProductsListItemModel.js'),
	CProductGroupsListItemModel = require('modules/%ModuleName%/js/models/CProductGroupsListItemModel.js'),
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
	this.requestProductsFullList();
	this.requestProductGroupsFullList();
};

CMainView.prototype.requestSalesList = function ()
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
				})) : []
		;
		this.salesList(aNewCollection);
		this.salesCount(iItemsCount);
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
	this.productGroupsSelector.initOnApplyBindings(
		'.product_groups_sub_list .item',
		'.product_groups_sub_list .selected.item',
		$('.product_groups_list', this.$viewDom),
		$('.product_groups_list_scroll.scroll-inner', this.$viewDom)
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
	this.newSalesSearchInput('');
	this.salesSearchInput('');
	this.salesSearchSubmit();
};

CMainView.prototype.showSales = function ()
{
	this.isProductsVisible(false);
	this.isProductGroupsVisible(false);
	this.isSalesVisible(true);
	this.selectedStorage(Enums.SalesStorages.Sales);
};

CMainView.prototype.saveSale = function ()
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
	this.requestProductsList();
	this.requestSalesList();
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

CMainView.prototype.showProducts = function ()
{
	this.isProductsVisible(true);
	this.isProductGroupsVisible(false);
	this.isSalesVisible(false);
	this.selectedStorage(Enums.SalesStorages.Products);
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
		sMethod = oProduct && oProduct.id === 0 ? 'CreateProduct' : 'UpdateProduct'
	;
	this.isUpdatingProduct(true);
	if (oProduct.sProductName === '')
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_INPUT'));
	}
	else
	{
		if (oProduct.id !== 0)
		{
			oParameters.ProductId = oProduct.id;
		}
		Ajax.send('Sales', sMethod, oParameters, this.onGetProductUpdateResponse, this);
	}
};

CMainView.prototype.onGetProductUpdateResponse = function (oResponse)
{
	var
		oResult = oResponse.Result,
		oProductElement = null,
		iProductId = this.selectedProductsItem().id
	;

	this.isUpdatingProduct(false);

	if (oResult)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
		//update item in full list
		oProductElement = _.find(this.productsFullList(), function(element) {
			if (element.id === iProductId)
			{
				return element;
			}
		});
		if (oProductElement !== null)
		{
			oProductElement.sProductTitle = this.selectedProductsItem().sProductTitle;
			oProductElement.sProductGroupUUID = this.selectedProductsItem().sProductGroupUUID;
			oProductElement.iShareItProductId = this.selectedProductsItem().iShareItProductId;
			oProductElement.sPayPalItem = this.selectedProductsItem().sPayPalItem;
			oProductElement.iProductPrice = this.selectedProductsItem().iProductPrice;
			oProductElement.sHomepage = this.selectedProductsItem().sHomepage;
		}
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
	}
	this.requestProductsList();
	this.requestSalesList();
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
//		this.productGroupsSelector.itemSelected(this.selectedProductGroupsItem());
	}
};

CMainView.prototype.viewProductGroupsItem = function (oItem)
{
	this.selectedProductGroupsItem(oItem);
};

CMainView.prototype.showProductGroups = function ()
{
	this.isProductGroupsVisible(true);
	this.isSalesVisible(false);
	this.isProductsVisible(false);
	this.selectedStorage(Enums.SalesStorages.ProductGroups);
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
	this.isUpdatingProductGroup(true);
	if (this.selectedProductGroupsItem().id === 0 || this.selectedProductGroupsItem().sTitle === "")
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_INPUT'));
	}
	else
	{
		Ajax.send(
			'Sales',
			'UpdateProductGroup', 
			{
				'ProductGroupId': this.selectedProductGroupsItem().id,
				'Title': this.selectedProductGroupsItem().sTitle,
				'Homepage': this.selectedProductGroupsItem().sHomepage,
				'ProductCode': this.selectedProductGroupsItem().sProductCode
			},
			this.onGetProductGroupUpdateResponse,
			this
		);
	}
};

CMainView.prototype.onGetProductGroupUpdateResponse = function (oResponse)
{
	var
		oResult = oResponse.Result,
		oGroupElement = null,
		iGroupId = this.selectedProductGroupsItem().id
	;

	this.isUpdatingProductGroup(false);

	if (oResult)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
		//update item in full list
		oGroupElement = _.find(this.productGroupsFullList(), function(element) {
			if (element.id === iGroupId)
			{
				return element;
			}
		});
		if (oGroupElement !== null)
		{
			oGroupElement.sTitle = this.selectedProductGroupsItem().sTitle;
			oGroupElement.sHomepage = this.selectedProductGroupsItem().sHomepage;
			oGroupElement.sProductCode = this.selectedProductGroupsItem().sProductCode;
		}
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
	}
	this.requestProductGroupsList();
};

module.exports = new CMainView();
