'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	ModuleErrors = require('%PathToCoreWebclientModule%/js/ModuleErrors.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	CProductsListItemModel = require('modules/%ModuleName%/js/models/CProductsListItemModel.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * View that is used as screen of products module.
 * 
 * @constructor
 */
function CProductsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.objectList = ko.observableArray([]);
	this.objectsCount = ko.observable(0);
	this.productsFullList = ko.observableArray([]);
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
		_.bind(this.viewProductsItem, this)
	);
	this.isSearch = ko.computed(function () {
		return this.searchValue() !== '';
	}, this);
	this.currentPage = ko.observable(1);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ItemsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentPage(iCurrentpage);
		this.requestProductsList();
	}, this);
	this.listLoading = ko.observable(false);
	this.isVisible = ko.observable(false);
	this.isUpdating = ko.observable(false);
	this.saveProduct = _.bind(this.saveProduct, this);
	this.removeProductBound = _.bind(this.removeProduct, this);
	this.selectedObject.subscribe(_.bind(function () {
		this.isUpdating(false);
	}, this));
	
	this.refreshCommand = Utils.createCommand(this, function () {
		this.requestProductsList();
	});
	this.refreshIndicator = ko.observable(true).extend({ throttle: 50 });
	ko.computed(function () {
		this.refreshIndicator(this.listLoading());
	}, this);
	this.activeAutocreatedFilter = ko.observable(false);
	this.showAutocreated = Utils.createCommand(this, function () {
		this. activeAutocreatedFilter(!this. activeAutocreatedFilter());
		this.requestProductsList();
	});
}

_.extendOwn(CProductsView.prototype, CAbstractScreenView.prototype);

CProductsView.prototype.ViewTemplate = '%ModuleName%_ProductsView';
CProductsView.prototype.EditViewTemplate = '%ModuleName%_ProductsEditView';
CProductsView.prototype.ViewConstructorName = 'CProductsView';

/**
 * @param {Array} aParams
 */
CProductsView.prototype.onRoute = function (aParams)
{
	
};

/**
 * Called every time when screen is shown.
 */
CProductsView.prototype.onShow = function ()
{
	if (this.objectList().length === 0)
	{
		this.requestProductsList();
	}
	this.oSelector.useKeyboardKeys(true);
};

CProductsView.prototype.requestProductsList = function ()
{
	var oFilters = {};

	if (this.activeAutocreatedFilter())
	{
		oFilters["Autocreated"] = true;
	}
	this.listLoading(true);
	this.searchValue(this.searchInputValue());
	Ajax.send(
		'Sales',
		'GetProducts', 
		{
			'Offset': (this.currentPage() - 1) * Settings.ItemsPerPage,
			'Limit': Settings.ItemsPerPage,
			'Search': this.searchValue(),
			'Filters': oFilters
		},
		this.onGetProductsResponse,
		this
	);
};

CProductsView.prototype.requestProductsFullList = function ()
{
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
			iSelectedId = this.selectedObject() ? this.selectedObject().id : 0,
			oSelectedObj = null,
			aNewCollection = oResult.Products ? _.compact(_.map(oResult.Products, function (oItemData) {
				var oItem = new CProductsListItemModel();
				oItem.parse(oItemData);
				if (oItem.id === iSelectedId)
				{
					oSelectedObj = oItem;
					oSelectedObj.selected(true);
				}
				return oItem;
			})) : []
		;
		this.objectList(aNewCollection);
		this.selectedObject(oSelectedObj);
		this.oSelector.itemSelected(oSelectedObj);
		this.objectsCount(iItemsCount);
		this.oPageSwitcher.setCount(iItemsCount);
	}
	else
	{
		this.objectList([]);
		this.objectsCount(0);
	}
	
	this.listLoading(false);
};

CProductsView.prototype.onGetProductsFullListResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			aNewProductsCollection = _.compact(_.map(oResult.Products, function (oItemData) {
				var oItem = new CProductsListItemModel();
				oItem.parse(oItemData);
				return oItem;
			})),
			oEmptyItem = new CProductsListItemModel()
		;

		if (this.objectList().length < 1)
		{
			this.objectList(aNewProductsCollection.slice(0, Settings.ItemsPerPage));
		}
		oEmptyItem.id = 0;
		oEmptyItem.sProductTitle = "-";
		aNewProductsCollection.unshift(oEmptyItem);
		this.productsFullList(aNewProductsCollection);
	}
};

CProductsView.prototype.viewProductsItem = function (oItem)
{
	this.selectedObject(oItem);
};

CProductsView.prototype.onClearProductsSearchClick = function ()
{
	// initiation empty search
	this.searchInputValue('');
	this.searchValue('');
	this.productsSearchSubmit();
};

CProductsView.prototype.productsSearchSubmit = function ()
{
	this.oPageSwitcher.currentPage(1);
	this.requestProductsList();
};

CProductsView.prototype.saveProduct = function ()
{
	var
		oProduct = this.selectedObject(),
		oParameters = oProduct ? {
			'Title': oProduct.sProductTitle,
			'ProductGroupUUID': oProduct.sProductGroupUUID,
			'ShareItProductId': oProduct.sShareItProductId,
			'CrmProductId': oProduct.sCrmProductId,
			'PayPalItem': oProduct.sPayPalItem,
			'ProductPrice': oProduct.dProductPrice,
			'Homepage': oProduct.sHomepage,
			'IsAutocreated': false
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
			this.isUpdating(true);
			Ajax.send('Sales', sMethod, oParameters, this.onGetProductUpdateResponse, this);
		}
	}
};

CProductsView.prototype.onGetProductUpdateResponse = function (oResponse)
{
	var sMessage = '';
	this.isUpdating(false);

	if (oResponse.Result)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
	}
	else
	{
		sMessage = ModuleErrors.getErrorMessage(oResponse);
		if (sMessage)
		{
			Screens.showError(sMessage);
		}
		else
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
		}
	}
	
	this.requestProductsFullList();
	this.requestProductsList();
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
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_REMOVE_PRODUCT'));
		this.requestProductsFullList();
		this.requestProductsList();
		this.selectedObject(null);
	}
};

CProductsView.prototype.show = function ()
{
	this.isVisible(true);
	this.oSelector.useKeyboardKeys(true);
};

CProductsView.prototype.hide = function ()
{
	this.isVisible(false);
	this.oSelector.useKeyboardKeys(false);
};

CProductsView.prototype.onBind = function ()
{
	this.requestProductsFullList();
	this.oSelector.initOnApplyBindings(
		'.products_sub_list .item',
		'.products_sub_list .selected.item',
		'.products_sub_list .selected.item',
		$('.products_list', this.$viewDom),
		$('.products_list_scroll.scroll-inner', this.$viewDom)
	);
};

CProductsView.prototype.onHide = function ()
{
	this.oSelector.useKeyboardKeys(false);
};

module.exports = new CProductsView();
