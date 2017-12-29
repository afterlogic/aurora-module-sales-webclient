'use strict';

var
	ko = require('knockout'),
	moment = require('moment'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CSalesListItemModel()
{	
	this.id = '';
	this.UUID = '';
	this.sDate = '';
	
	this.iCustomerId = 0;
	this.sEmail = '';
	this.sCustomerRegName = '';
	this.sPhone = '';
	this.sLanguage = '';
	
	this.iProductCode = 0;
	this.iProductId = 0;
	this.sProductTitle = '';
	
	this.sLicenseKey = '';
	this.iNetTotal = 0;
	this.sMaintenanceExpirationDate = '';
	this.sPayPalItem = '';

	this.selected = ko.observable(false);
	this.checked = ko.observable(false);
}

CSalesListItemModel.prototype.parse = function (oData, aCustomers, aProducts)
{
	var
		sModuleName = 'Sales',
		oCustomer = typeof aCustomers[oData['CustomerUUID']] !== 'undefined' ? aCustomers[oData['CustomerUUID']] : null,
		oProduct = typeof aProducts[oData['ProductUUID']] !== 'undefined' ? aProducts[oData['ProductUUID']] : null
	;

	this.id =  Types.pInt(oData['EntityId'], this.id);
	this.UUID =  Types.pString(oData['UUID'], this.UUID);
	this.sDate =  moment(oData['Date']).format(Settings.FullDateFormat + ' ' + Settings.getTimeFormat());
	
	if (oCustomer !== null)
	{
		this.iCustomerId = Types.pInt(oCustomer['EntityId'], this.iCustomerId);
		this.sEmail = Types.pString(oCustomer[sModuleName + '::Email'], this.sEmail);
		this.sCustomerRegName = Types.pString(oCustomer[sModuleName + '::FullName'], this.sCustomerRegName);
		this.sPhone = Types.pString(oCustomer[sModuleName + '::Phone'], this.sPhone);
		this.sLanguage = Types.pString(oCustomer[sModuleName + '::Language'], this.sLanguage);
	}
	
	if (oProduct !== null)
	{
		this.iProductCode = Types.pInt(oProduct[sModuleName + '::ProductCode'], this.iProductCode);
		this.iProductId = Types.pInt(oProduct['EntityId'], this.iProductId);
		this.sProductTitle = Types.pString(oProduct['Title'], this.sProductTitle);
	}
	
	this.sLicenseKey = Types.pString(oData[sModuleName + '::LicenseKey'], this.sLicenseKey);
	this.iNetTotal = Types.pInt(oData['Price'], this.iNetTotal);
	this.sMaintenanceExpirationDate = Types.pString(oData[sModuleName + '::MaintenanceExpirationDate'], this.sMaintenanceExpirationDate);
	this.sPayPalItem = Types.pString(oData[sModuleName + '::PayPalItem'], this.sPayPalItem);
};

module.exports = CSalesListItemModel;
