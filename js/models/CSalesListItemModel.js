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
	this.sRawData = '';
	this.sRawDataType = 0;

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
		oCustomer = typeof oCustomers[oData[sModuleName + "::CustomerUUID"]] !== 'undefined' ? oCustomers[oData[sModuleName + "::CustomerUUID"]] : null,
		oProduct = typeof oProducts[oData[sModuleName + "::ProductUUID"]] !== 'undefined' ? oProducts[oData[sModuleName + "::ProductUUID"]] : null
	;

	this.id =  Types.pInt(oData['EntityId']);
	this.UUID =  Types.pString(oData['UUID']);
	this.sDate =  moment(oData["Date"]).format('YYYY-MM-DD HH:mm');
	this.iCustomerId = oCustomer !== null ? Types.pInt(oCustomer['EntityId']) : 0;
	this.sEmail = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Email"]) : "";
	this.sCustomerRegName = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::RegName"]) : "";
	this.sPhone = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Phone"]) : "";
	this.sLanguage = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Language"]) : "";
	this.iProductCode = oProduct !== null ? Types.pInt(oProduct[sModuleName + "::ProductCode"]) : 0;
	this.iProductId = oProduct !== null ? Types.pInt(oProduct['EntityId']) : 0;
	this.sProductName = oProduct !== null ? Types.pString(oProduct[sModuleName + "::ProductName"]) : 0;
	this.sLicenseKey = Types.pString(oData[sModuleName + "::LicenseKey"]);
	this.iNetTotal = Types.pInt(oData["Price"]);
	this.sMaintenanceExpirationDate = Types.pString(oData[sModuleName + "::MaintenanceExpirationDate"]);
	this.sRawData = Types.pString(oData[sModuleName + "::RawData"]);
	this.sRawDataType = Types.pInt(oData[sModuleName + "::RawDataType"]);
};

module.exports = CSalesListItemModel;