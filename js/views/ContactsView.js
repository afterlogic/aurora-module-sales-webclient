'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	ModuleErrors = require('%PathToCoreWebclientModule%/js/ModuleErrors.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	CContactsListItemModel = require('modules/%ModuleName%/js/models/CContactsListItemModel.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * View that is used as screen of sales module.
 * 
 * @constructor
 */
function CContactsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.objectList = ko.observableArray([]);
	this.objectsCount = ko.observable(0);
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
		_.bind(this.viewContactsItem, this)
	);
	this.isSearch = ko.computed(function () {
		return this.searchValue() !== '';
	}, this);
	this.currentPage = ko.observable(1);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ItemsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentPage(iCurrentpage);
		this.requestContactsList();
	}, this);
	this.listLoading = ko.observable(false);
	this.isVisible =  ko.observable(false);
	this.isUpdating = ko.observable(false);
	this.saveContactBound = _.bind(this.saveContact, this);
	this.removeContactBound = _.bind(this.removeContact, this);
	this.selectedObject.subscribe(_.bind(function () {
		this.isUpdating(false);
	}, this));
}

_.extendOwn(CContactsView.prototype, CAbstractScreenView.prototype);

CContactsView.prototype.ViewTemplate = '%ModuleName%_ContactsView';
CContactsView.prototype.EditViewTemplate = '%ModuleName%_ContactsEditView';
CContactsView.prototype.ViewConstructorName = 'CContactsView';

/**
 * Called every time when screen is shown.
 */
CContactsView.prototype.onShow = function ()
{
	this.requestContactsList();
};

CContactsView.prototype.requestContactsList = function ()
{
	this.listLoading(true);
	this.searchValue(this.searchInputValue());
	Ajax.send(
		'Sales',
		'GetContacts', 
		{
			'Offset': (this.currentPage() - 1) * Settings.ItemsPerPage,
			'Limit': Settings.ItemsPerPage,
			'Search': this.searchValue()
		},
		this.onGetContactsResponse,
		this
	);
};

CContactsView.prototype.onGetContactsResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			aNewCollection = _.compact(_.map(oResult.Contacts, function (oItemData) {
					var oItem = new CContactsListItemModel();
					oItem.parse(oItemData);
					return oItem;
				}))
		;
		this.objectList(aNewCollection);
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

CContactsView.prototype.viewContactsItem = function (oItem)
{
	this.selectedObject(oItem);
};

CContactsView.prototype.onBind = function ()
{
	this.oSelector.initOnApplyBindings(
		'.contacts_sub_list .item',
		'.contacts_sub_list .selected.item',
		$('.contacts_list', this.$viewDom),
		$('.contacts_list_scroll.scroll-inner', this.$viewDom)
	);
};

CContactsView.prototype.contactsSearchSubmit = function ()
{
	this.oPageSwitcher.currentPage(1);
	this.requestContactsList();
};

CContactsView.prototype.onClearContactsSearchClick = function ()
{
	// initiation empty search
	this.searchInputValue('');
	this.searchValue('');
	this.contactsSearchSubmit();
};

CContactsView.prototype.show = function ()
{
	this.isVisible(true);
};

CContactsView.prototype.hide = function ()
{
	this.isVisible(false);
};

CContactsView.prototype.saveContact = function ()
{
	this.isUpdating(true);
	if (this.selectedObject().id === 0 || this.selectedObject().iProductId === 0)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_INPUT'));
	}
	else
	{
		Ajax.send(
			'Sales',
			'UpdateContact', 
			{
				'ContactId': this.selectedObject().id,
				'FullName': this.selectedObject().sFullName,
				'Email': this.selectedObject().sEmail,
				'Address': this.selectedObject().sAddress,
			},
			this.onGetContactUpdateResponse,
			this
		);
	}
};

CContactsView.prototype.onGetContactUpdateResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	this.isUpdating(false);

	if (oResult)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
	}
	this.requestContactsList();
};

CContactsView.prototype.removeContact = function (oContact)
{
	Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_CONTACT'),  _.bind(function (bConfirm) {
		if (bConfirm)
		{
			Ajax.send(
				'Sales',
				'DeleteContact',
				{'IdOrUUID': oContact.UUID},
				this.onDeleteContactResponse, 
				this
			);
		}
	}, this), oContact.sFullName || oContact.sEmail]);
};

CContactsView.prototype.onDeleteContactResponse = function (oResponse)
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
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_REMOVE_CONTACT'));
		this.requestContactsList();
		this.selectedObject(null);
	}
};

module.exports = new CContactsView();
