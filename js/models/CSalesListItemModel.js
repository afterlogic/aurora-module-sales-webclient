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
	this.iProductCode = 0;
	this.sProductName = '';
	this.sLicenseKey = '';
	this.iNetTotal = 0;
	this.iCustomerId = 0;
	this.sCustomerRegName = '';
	this.sPhone = '';
	this.sLanguage = '';
	this.iProductId = 0;
	this.sMaintenanceExpirationDate = '';
	this.sAdditionalInfo = '';

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
	this.iCustomerId = oCustomer !== null ? Types.pInt(oCustomer['EntityId']) : 0;
	this.sEmail = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Email"]) : "";
	this.sCustomerRegName = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::RegName"]) : "";
	this.sPhone = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Phone"]) : "";
	this.sLanguage = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Language"]) : "";
	this.iProductCode = oProduct !== null ? Types.pInt(oProduct[sModuleName + "::ProductCode"]) : 0;
	this.iProductId = oProduct !== null ? Types.pInt(oProduct['EntityId']) : 0;
	this.sProductName = oProduct !== null ? Types.pString(oProduct[sModuleName + "::ProductName"]) : 0;
	this.sLicenseKey = Types.pString(oData[sModuleName + "::LicenseKey"]);
	this.iNetTotal = Types.pInt(oData[sModuleName + "::NetTotal"]);
	this.sMaintenanceExpirationDate = Types.pString(oData[sModuleName + "::MaintenanceExpirationDate"]);
	this.sAdditionalInfo = Types.pString(oData[sModuleName + "::AdditionalInfo"]);
};

module.exports = CSalesListItemModel;