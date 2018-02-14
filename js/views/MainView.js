'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	
	CProductsListItemModel = require('modules/%ModuleName%/js/models/CProductsListItemModel.js'),
	CProductGroupsListItemModel = require('modules/%ModuleName%/js/models/CProductGroupsListItemModel.js')
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
	this.oDownloadsView = require('modules/%ModuleName%/js/views/DownloadsView.js');
	this.oProductsView = require('modules/%ModuleName%/js/views/ProductsView.js');
	this.oProductGroupsView = require('modules/%ModuleName%/js/views/ProductGroupsView.js');
	this.oContactsView = require('modules/%ModuleName%/js/views/ContactsView.js');
	
	this.oSalesView.productsFullList = this.oProductsView.productsFullList;
	this.oProductsView.productGroupsFullList = this.oProductGroupsView.productGroupsFullList;
	this.oSalesView.productGroupsFullList = this.oProductGroupsView.productGroupsFullList;
	this.oDownloadsView.productsFullList = this.oProductsView.productsFullList;
	this.oDownloadsView.productGroupsFullList = this.oProductGroupsView.productGroupsFullList;
	
	/**
	 * Text for displaying in browser title when sales screen is shown.
	 */
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
	
	this.selectedType = ko.observable(Enums.SalesObjectsTypes.Sales);
	this.bigButtonText = ko.computed(function () {
		switch (this.selectedType())
		{
			case Enums.SalesObjectsTypes.Products:
				return TextUtils.i18n('%MODULENAME%/ACTION_NEW_PRODUCT');
			case Enums.SalesObjectsTypes.ProductGroups:
				return TextUtils.i18n('%MODULENAME%/ACTION_NEW_PRODUCTS_GROUP');
			case Enums.SalesObjectsTypes.Sales:
				return this.oSalesView.getBigButtonText();

		}
		return '';
	}, this);
	this.bigButtonCommand = Utils.createCommand(this, function () {
		switch (this.selectedType())
		{
			case Enums.SalesObjectsTypes.Products:
				this.oProductsView.selectedObject(new CProductsListItemModel());
				this.oProductsView.oSelector.itemSelected(null);
				break;
			case Enums.SalesObjectsTypes.ProductGroups:
				this.oProductGroupsView.selectedObject(new CProductGroupsListItemModel());
				this.oProductGroupsView.oSelector.itemSelected(null);
				break;
			case Enums.SalesObjectsTypes.Sales:
				this.oSalesView.parseSales();
				break;
		}
	});
	
	this.aObjectTabs = [
		{
			sType: Enums.SalesObjectsTypes.Sales,
			sText: TextUtils.i18n('%MODULENAME%/ACTION_SHOW_SALES_LIST')
		},
		{
			sType: Enums.SalesObjectsTypes.Downloads,
			sText: TextUtils.i18n('%MODULENAME%/ACTION_SHOW_DOWNLOADS_LIST')
		},
		{
			sType: Enums.SalesObjectsTypes.Products,
			sText: TextUtils.i18n('%MODULENAME%/ACTION_SHOW_PRODUCTS_LIST')
		},
		{
			sType: Enums.SalesObjectsTypes.ProductGroups,
			sText: TextUtils.i18n('%MODULENAME%/ACTION_SHOW_PRODUCT_GROUPS_LIST')
		},
		{
			sType: Enums.SalesObjectsTypes.Contacts,
			sText: TextUtils.i18n('%MODULENAME%/ACTION_SHOW_CONTACTS_LIST')
		}
	];
	
	this.showSalesWithContactBound = _.bind(this.showSalesWithContact, this);
	this.showSalesWithProductBound = _.bind(this.showSalesWithProduct, this);
	this.showDownloadsWithProductBound = _.bind(this.showDownloadsWithProduct, this);
}

_.extendOwn(CMainView.prototype, CAbstractScreenView.prototype);

CMainView.prototype.ViewTemplate = '%ModuleName%_MainView';
CMainView.prototype.ViewConstructorName = 'CMainView';

CMainView.prototype.showSalesWithContact = function (oContact)
{
	if (_.isFunction(this.oSalesView.requestSearchSalesList))
	{
		this.showObjects(Enums.SalesObjectsTypes.Sales);
		this.oSalesView.requestSearchSalesList(oContact.sEmail || oContact.sFullName || oContact.sLastName || oContact.sFirstName);
	}
};

CMainView.prototype.showSalesWithProduct = function (oProduct)
{
	this.oSalesView.searchByProduct(oProduct);
	this.oSalesView.searchInputValue('');
	this.showObjects(Enums.SalesObjectsTypes.Sales);
	this.oSalesView.requestSalesList();
};

CMainView.prototype.showDownloadsWithProduct = function (oProduct)
{
	this.oDownloadsView.searchByProduct(oProduct);
	this.oDownloadsView.searchInputValue('');
	this.showObjects(Enums.SalesObjectsTypes.Downloads);
	this.oDownloadsView.requestDownloadsList();
};

CMainView.prototype.showObjects = function (sType)
{
	switch (sType)
	{
		case Enums.SalesObjectsTypes.Sales:
			this.oSalesView.show();
			this.oDownloadsView.hide();
			this.oProductsView.hide();
			this.oProductGroupsView.hide();
			this.oContactsView.hide();
			this.selectedType(Enums.SalesObjectsTypes.Sales);
			break;
		case Enums.SalesObjectsTypes.Downloads:
			this.oSalesView.hide();
			this.oDownloadsView.show();
			this.oProductsView.hide();
			this.oProductGroupsView.hide();
			this.oContactsView.hide();
			this.selectedType(Enums.SalesObjectsTypes.Downloads);
			break;
		case Enums.SalesObjectsTypes.Products:
			this.oSalesView.hide();
			this.oDownloadsView.hide();
			this.oProductsView.show();
			this.oProductGroupsView.hide();
			this.oContactsView.hide();
			this.selectedType(Enums.SalesObjectsTypes.Products);
			break;
		case Enums.SalesObjectsTypes.ProductGroups:
			this.oSalesView.hide();
			this.oDownloadsView.hide();
			this.oProductGroupsView.show();
			this.oProductsView.hide();
			this.oContactsView.hide();
			this.selectedType(Enums.SalesObjectsTypes.ProductGroups);
			break;
		case Enums.SalesObjectsTypes.Contacts:
			this.oSalesView.hide();
			this.oDownloadsView.hide();
			this.oProductGroupsView.hide();
			this.oProductsView.hide();
			this.oContactsView.show();
			this.selectedType(Enums.SalesObjectsTypes.Contacts);
			break;
	}
};

/**
 * Called every time when screen is shown.
 */
CMainView.prototype.onShow = function ()
{
	this.oSalesView.onShow();
	this.oDownloadsView.onShow();
	this.oProductsView.onShow();
	this.oProductGroupsView.onShow();
	this.oContactsView.onShow();
};

CMainView.prototype.onBind = function ()
{
	this.oSalesView.onBind();
	this.oDownloadsView.onBind();
	this.oProductsView.onBind();
	this.oProductGroupsView.onBind();
	this.oContactsView.onBind();
};

module.exports = new CMainView();
