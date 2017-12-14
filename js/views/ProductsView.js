'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CProductsListItemModel = require('modules/%ModuleName%/js/models/CProductsListItemModel.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * View that is used as screen of products module.
 * 
 * @constructor
 */
function CProductsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	this.iItemsPerPage = 20;
	/**
	 * Text for displaying in browser title when products screen is shown.
	 */
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
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
}

_.extendOwn(CProductsView.prototype, CAbstractScreenView.prototype);

CProductsView.prototype.ViewTemplate = '%ModuleName%_ProductsView';
CProductsView.prototype.EditViewTemplate = '%ModuleName%_ProductsEditView';
CProductsView.prototype.ViewConstructorName = 'CProductsView';

/**
 * Called every time when screen is shown.
 */
CProductsView.prototype.onShow = function ()
{
	this.requestProductsList();
};
CProductsView.prototype.requestProductsList = function ()
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

CProductsView.prototype.requestProductsFullList = function ()
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

CProductsView.prototype.onGetProductsResponse = function (oResponse)
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

CProductsView.prototype.onGetProductsFullListResponse = function (oResponse)
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

CProductsView.prototype.viewProductsItem = function (oItem)
{
	this.selectedProductsItem(oItem);
};

CProductsView.prototype.onClearProductsSearchClick = function ()
{
	// initiation empty search
	this.newProductsSearchInput('');
	this.productsSearchInput('');
	this.productsSearchSubmit();
};

CProductsView.prototype.productsSearchSubmit = function ()
{
	this.oProductsPageSwitcher.currentPage(1);
	this.requestProductsList();
};

CProductsView.prototype.saveProduct = function ()
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

CProductsView.prototype.onGetProductUpdateResponse = function (oResponse)
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

CProductsView.prototype.removeProduct = function (oProduct)
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

CProductsView.prototype.onProductDeleteResponse = function (oResponse)
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

CProductsView.prototype.show = function ()
{
	this.isProductsVisible(true);
};

CProductsView.prototype.hide = function ()
{
	this.isProductsVisible(false);
};

CProductsView.prototype.onBind = function ()
{
	this.productsSelector.initOnApplyBindings(
		'.products_sub_list .item',
		'.products_sub_list .selected.item',
		$('.products_list', this.$viewDom),
		$('.products_list_scroll.scroll-inner', this.$viewDom)
	);
};

module.exports = new CProductsView();
