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
CSalesListItemModel.prototype.parse = function (oData)
{
	var sModuleName = 'Sales';
	this.id =  Types.pInt(oData['EntityId']);
	this.UUID =  Types.pString(oData['UUID']);
	this.sDate =  moment(oData[sModuleName + "::Date"]).format('YYYY-MM-DD HH:mm');
	this.iCustomerId = Types.pInt(oData[sModuleName + "::CustomerId"]);
	this.sEmail = Types.pString(oData[sModuleName + "::CustomerEmail"]);
	this.sCustomerRegName = Types.pString(oData[sModuleName + "::CustomerRegName"]);
	this.iProductCode = Types.pInt(oData[sModuleName + "::ProductCode"]);
	this.sProductName = Types.pString(oData[sModuleName + "::ProductName"]);
	this.sLicenseKey = Types.pString(oData[sModuleName + "::LicenseKey"]);
	this.iNetTotal = Types.pInt(oData[sModuleName + "::NetTotal"]);
};

module.exports = CSalesListItemModel;