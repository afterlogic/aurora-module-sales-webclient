'use strict';

var
	ko = require('knockout'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * @constructor
 */
function CProductsListItemModel()
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
CProductsListItemModel.prototype.parse = function (oData)
{
	var
		sModuleName = 'Sales'
	;

	this.id =  Types.pInt(oData['EntityId']);
	this.UUID =  Types.pString(oData['UUID']);
	this.iProductCode = Types.pInt(oData[sModuleName + "::ProductCode"]);
	this.sProductName = Types.pString(oData[sModuleName + "::ProductName"]);
	this.iShareItProductId = Types.pString(oData[sModuleName + "::ShareItProductId"]);
	this.bIsAutocreated = Types.pString(oData[sModuleName + "::IsAutocreated"]);
};

module.exports = CProductsListItemModel;