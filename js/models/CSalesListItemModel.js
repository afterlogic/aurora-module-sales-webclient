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
	this.iLicenseCode = 0;
	this.sLicenseName = '';
	this.sLicenseKey = '';
	this.iNetTotal = 0;
	this.iCustomerId = 0;
	this.sCustomerRegName = '';
	this.sPhone = '';
	this.sLanguage = '';
	this.iLicenseId = 0;
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
CSalesListItemModel.prototype.parse = function (oData, oCustomers, oLicenses)
{
	var
		sModuleName = 'Sales',
		oCustomer = typeof oCustomers[oData[sModuleName + "::CustomerId"]] !== 'undefined' ? oCustomers[oData[sModuleName + "::CustomerId"]] : null,
		oLicense = typeof oLicenses[oData[sModuleName + "::LicenseId"]] !== 'undefined' ? oLicenses[oData[sModuleName + "::LicenseId"]] : null
	;

	this.id =  Types.pInt(oData['EntityId']);
	this.UUID =  Types.pString(oData['UUID']);
	this.sDate =  moment(oData[sModuleName + "::Date"]).format('YYYY-MM-DD HH:mm');
	this.iCustomerId = oCustomer !== null ? Types.pInt(oCustomer['EntityId']) : 0;
	this.sEmail = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Email"]) : "";
	this.sCustomerRegName = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::RegName"]) : "";
	this.sPhone = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Phone"]) : "";
	this.sLanguage = oCustomer !== null ? Types.pString(oCustomer[sModuleName + "::Language"]) : "";
	this.iLicenseCode = oLicense !== null ? Types.pInt(oLicense[sModuleName + "::LicenseCode"]) : 0;
	this.iLicenseId = oLicense !== null ? Types.pInt(oLicense['EntityId']) : 0;
	this.sLicenseName = oLicense !== null ? Types.pString(oLicense[sModuleName + "::LicenseName"]) : 0;
	this.sLicenseKey = Types.pString(oData[sModuleName + "::LicenseKey"]);
	this.iNetTotal = Types.pInt(oData[sModuleName + "::NetTotal"]);
	this.sMaintenanceExpirationDate = Types.pString(oData[sModuleName + "::MaintenanceExpirationDate"]);
	this.sRawData = Types.pString(oData[sModuleName + "::RawData"]);
	this.sRawDataType = Types.pInt(oData[sModuleName + "::RawDataType"]);
};

module.exports = CSalesListItemModel;