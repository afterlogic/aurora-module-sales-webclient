'use strict';

var
	ko = require('knockout'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * @constructor
 */
function CLicensesListItemModel()
{
	this.id = '';
	this.UUID = '';

	this.iLicenseCode = 0;
	this.sLicenseName = '';
	this.iShareItLicenseId = 0;
	this.bIsAutocreated = false;
	this.sPayPalItem = '';

	this.selected = ko.observable(false);
	this.checked = ko.observable(false);
}

/**
 *
 * @param {Object} oData
 */
CLicensesListItemModel.prototype.parse = function (oData)
{
	var
		sModuleName = 'Sales'
	;

	this.id =  Types.pInt(oData['EntityId']);
	this.UUID =  Types.pString(oData['UUID']);
	this.iLicenseCode = Types.pInt(oData[sModuleName + "::LicenseCode"]);
	this.sLicenseName = Types.pString(oData[sModuleName + "::LicenseName"]);
	this.iShareItLicenseId = Types.pInt(oData[sModuleName + "::ShareItLicenseId"]);
	this.bIsAutocreated = !!oData[sModuleName + "::IsAutocreated"];
	this.sPayPalItem = Types.pString(oData[sModuleName + "::PayPalItem"]);
};

module.exports = CLicensesListItemModel;