'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CProductGroupsListItemModel = require('modules/%ModuleName%/js/models/CProductGroupsListItemModel.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * View that is used as screen of products module.
 * 
 * @constructor
 */
function CProductGroupsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	this.iItemsPerPage = 20;
	/**
	 * Text for displaying in browser title when product groups screen is shown.
	 */
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
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
}

_.extendOwn(CProductGroupsView.prototype, CAbstractScreenView.prototype);

CProductGroupsView.prototype.ViewTemplate = '%ModuleName%_ProductGroupsView';
CProductGroupsView.prototype.EditViewTemplate = '%ModuleName%_ProductGroupsEditView';
CProductGroupsView.prototype.ViewConstructorName = 'CProductGroupsView';

/**
 * Called every time when screen is shown.
 */
CProductGroupsView.prototype.onShow = function ()
{
	this.requestProductGroupsFullList();
};
//Product groups
CProductGroupsView.prototype.requestProductGroupsList = function ()
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

CProductGroupsView.prototype.onGetProductGroupsResponse = function (oResponse)
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

CProductGroupsView.prototype.viewProductGroupsItem = function (oItem)
{
	this.selectedProductGroupsItem(oItem);
};

CProductGroupsView.prototype.onClearProductGroupsSearchClick = function ()
{
	// initiation empty search
	this.newProductGroupsSearchInput('');
	this.productGroupsSearchInput('');
	this.productGroupsSearchSubmit();
};

CProductGroupsView.prototype.productGroupsSearchSubmit = function ()
{
	this.oProductGroupsPageSwitcher.currentPage(1);
	this.requestProductGroupsList();
};

CProductGroupsView.prototype.saveProductGroup = function ()
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

CProductGroupsView.prototype.onGetProductGroupUpdateResponse = function (oResponse)
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

CProductGroupsView.prototype.removeProductGroup = function (oProductGroup)
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

CProductGroupsView.prototype.onProductGroupDeleteResponse = function (oResponse)
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

CProductGroupsView.prototype.show = function ()
{
	this.isProductGroupsVisible(true);
};

CProductGroupsView.prototype.hide = function ()
{
	this.isProductGroupsVisible(false);
};

CProductGroupsView.prototype.onBind = function ()
{
	this.productGroupsSelector.initOnApplyBindings(
		'.product_groups_sub_list .item',
		'.product_groups_sub_list .selected.item',
		$('.product_groups_list', this.$viewDom),
		$('.product_groups_list_scroll.scroll-inner', this.$viewDom)
	);
};

CProductGroupsView.prototype.requestProductGroupsFullList = function ()
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

CProductGroupsView.prototype.onGetProductGroupsFullListResponse = function (oResponse)
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

module.exports = new CProductGroupsView();
