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
	this.oProductsView = require('modules/%ModuleName%/js/views/ProductsView.js');
	this.oProductGroupsView = require('modules/%ModuleName%/js/views/ProductGroupsView.js');
	
	this.iItemsPerPage = 20;
	/**
	 * Text for displaying in browser title when sales screen is shown.
	 */
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
	
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
			this.oProductsView.hide();
			this.oProductGroupsView.hide();
			this.selectedStorage(Enums.SalesStorages.Sales);
			break;
		case Enums.SalesStorages.Products:
			this.oSalesView.hide();
			this.oProductsView.show();
			this.oProductGroupsView.hide();
			this.selectedStorage(Enums.SalesStorages.Products);
			break;
		case Enums.SalesStorages.ProductGroups:
			this.oSalesView.hide();
			this.oProductGroupsView.show();
			this.oProductsView.hide();
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
	this.oProductsView.onShow();
	this.oProductGroupsView.onShow();
};

CMainView.prototype.onBind = function ()
{
	this.oSalesView.onBind();
	this.oProductsView.onBind();
	this.oProductGroupsView.onBind();
};

module.exports = new CMainView();
