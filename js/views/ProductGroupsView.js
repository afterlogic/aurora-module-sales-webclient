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
	
	CProductGroupsListItemModel = require('modules/%ModuleName%/js/models/CProductGroupsListItemModel.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * View that is used as screen of products module.
 * 
 * @constructor
 */
function CProductGroupsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.objectList = ko.observableArray([]);
	this.objectsCount = ko.observable(0);
	this.productGroupsFullList = ko.observableArray([]);
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
		_.bind(this.viewProductGroupsItem, this)
	);
	this.isSearch = ko.computed(function () {
		return this.searchValue() !== '';
	}, this);
	this.currentPage = ko.observable(1);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ItemsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentPage(iCurrentpage);
		this.requestProductGroupsList();
	}, this);
	this.listLoading = ko.observable(false);
	this.isVisible = ko.observable(false);
	this.isUpdating = ko.observable(false);
	this.saveProductGroup = _.bind(this.saveProductGroup, this);
	this.removeProductGroupBound = _.bind(this.removeProductGroup, this);
	this.selectedObject.subscribe(_.bind(function () {
		this.isUpdating(false);
	}, this));
	
	this.refreshCommand = Utils.createCommand(this, function () {
		this.requestProductGroupsList();
	});
	this.refreshIndicator = ko.observable(true).extend({ throttle: 50 });
	ko.computed(function () {
		this.refreshIndicator(this.listLoading());
	}, this);
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
	if (this.objectList().length === 0)
	{
		this.requestProductGroupsList();
	}
};

CProductGroupsView.prototype.requestProductGroupsList = function ()
{
	this.listLoading(true);
	this.searchValue(this.searchInputValue());
	Ajax.send(
		'Sales',
		'GetProductGroups', 
		{
			'Offset': (this.currentPage() - 1) * Settings.ItemsPerPage,
			'Limit': Settings.ItemsPerPage,
			'Search': this.searchValue()
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
			iSelectedId = this.selectedObject() ? this.selectedObject().id : 0,
			oSelectedObj = null,
			aNewCollection = oResult.ProductGroups ? _.compact(_.map(oResult.ProductGroups, function (oItemData) {
				var oItem = new CProductGroupsListItemModel();
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

CProductGroupsView.prototype.viewProductGroupsItem = function (oItem)
{
	this.selectedObject(oItem);
};

CProductGroupsView.prototype.onClearProductGroupsSearchClick = function ()
{
	// initiation empty search
	this.searchInputValue('');
	this.searchValue('');
	this.productGroupsSearchSubmit();
};

CProductGroupsView.prototype.productGroupsSearchSubmit = function ()
{
	this.oPageSwitcher.currentPage(1);
	this.requestProductGroupsList();
};

CProductGroupsView.prototype.saveProductGroup = function ()
{
	var
		oProductGroup = this.selectedObject(),
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
			this.isUpdating(true);
			Ajax.send('Sales', sMethod, oParameters, this.onGetProductGroupUpdateResponse, this);
		}
	}
};

CProductGroupsView.prototype.onGetProductGroupUpdateResponse = function (oResponse)
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
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_REMOVE_PRODUCT_GROUP'));
		this.requestProductGroupsFullList();
		this.requestProductGroupsList();
		this.selectedObject(null);
	}
};

CProductGroupsView.prototype.show = function ()
{
	this.isVisible(true);
};

CProductGroupsView.prototype.hide = function ()
{
	this.isVisible(false);
};

CProductGroupsView.prototype.onBind = function ()
{
	this.requestProductGroupsFullList();
	this.oSelector.initOnApplyBindings(
		'.product_groups_sub_list .item',
		'.product_groups_sub_list .selected.item',
		'.product_groups_sub_list .selected.item',
		$('.product_groups_list', this.$viewDom),
		$('.product_groups_list_scroll.scroll-inner', this.$viewDom)
	);
};

CProductGroupsView.prototype.requestProductGroupsFullList = function ()
{
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
			aNewProductGroupsCollection = _.compact(_.map(oResult.ProductGroups, function (oItemData) {
				var oItem = new CProductGroupsListItemModel();
				oItem.parse(oItemData);
				return oItem;
			})),
			oEmptyGroupItem = new CProductGroupsListItemModel()
		;
		if (this.objectList().length < 1)
		{
			this.objectList(aNewProductGroupsCollection.slice(0, Settings.ItemsPerPage));
		}
		oEmptyGroupItem.id = 0;
		oEmptyGroupItem.UUID = "";
		oEmptyGroupItem.sTitle = "-";
		aNewProductGroupsCollection.unshift(oEmptyGroupItem);
		this.productGroupsFullList(aNewProductGroupsCollection);
	}
};

module.exports = new CProductGroupsView();
