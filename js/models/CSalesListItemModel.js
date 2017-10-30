'use strict';

var
	ko = require('knockout'),
	moment = require('moment'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * @constructor
 */
function CSalesListItemModel()
{	
	this.id = '';
	this.UUID = '';
	
	this.sDate = '';
	this.sEmail = '';
	this.iProductCode = '';
	this.sProductName = '';
	this.sLicenseKey = '';
	this.iNetTotal = '';
	this.iCustomerId = '';
	this.sLicenseKey = '';
	this.iNetTotal = '';

	this.selected = ko.observable(false);
	this.checked = ko.observable(false);
}

/**
 *
 * @param {Object} oData
 */
CSalesListItemModel.prototype.parse = function (oData, oCustomers, oProducts)
{
	var
		sModuleName = 'Sales',
		oCustomer = typeof oCustomers[oData[sModuleName + "::CustomerId"]] !== 'undefined' ? oCustomers[oData[sModuleName + "::CustomerId"]] : null,
		oProduct = typeof oProducts[oData[sModuleName + "::ProductId"]] !== 'undefined' ? oProducts[oData[sModuleName + "::ProductId"]] : null
	;

	this.id =  Types.pInt(oData['EntityId']);
	this.UUID =  Types.pString(oData['UUID']);
	this.sDate =  moment(oData[sModuleName + "::Date"]).format('YYYY-MM-DD HH:mm');
	this.sEmail = Types.pString(oCustomer[sModuleName + "::Email"]);
	this.sCustomerRegName = Types.pString(oCustomer[sModuleName + "::RegName"]);
	this.iProductCode = Types.pInt(oProduct[sModuleName + "::ProductCode"]);
	this.sProductName = Types.pString(oProduct[sModuleName + "::ProductName"]);
	this.sLicenseKey = Types.pString(oData[sModuleName + "::LicenseKey"]);
	this.iNetTotal = Types.pInt(oData[sModuleName + "::NetTotal"]);
	this.sPhone = Types.pString(oCustomer[sModuleName + "::Phone"]);
	this.sLanguage = Types.pString(oData[sModuleName + "::Language"]);
	this.sMaintenanceExpirationDate = Types.pString(oData[sModuleName + "::MaintenanceExpirationDate"]);
};

module.exports = CSalesListItemModel;