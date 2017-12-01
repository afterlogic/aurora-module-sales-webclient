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
	
	this.sProductGroupUUID = '';
	this.sProductName = '';
	this.iShareItProductId = 0;
	this.bIsAutocreated = false;
	this.sPayPalItem = '';
	this.iProductPrice = 0;
	this.sHomepage = '';

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
	this.sProductGroupUUID = Types.pString(oData["ProductGroupUUID"]);
	this.sProductName = Types.pString(oData[sModuleName + "::ProductName"]);
	this.iShareItProductId = Types.pInt(oData[sModuleName + "::ShareItProductId"]);
	this.bIsAutocreated = !!oData[sModuleName + "::IsAutocreated"];
	this.sPayPalItem = Types.pString(oData[sModuleName + "::PayPalItem"]);
	this.iProductPrice = Types.pInt(oData['Price']);
	this.sHomepage = Types.pString(oData['Homepage']);
};

module.exports = CProductsListItemModel;