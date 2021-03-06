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
	this.sProductTitle = '';
	this.sShareItProductId = '';
	this.sCrmProductId = '';
	this.bIsAutocreated = false;
	this.sPayPalItem = '';
	this.dProductPrice = 0;
	this.sHomepage = '';
	this.sProductGroupTitle = '';
	this.sMailchimpGroupTitle = '';
	this.sMailchimpGroupUUID = '';

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
	this.sProductTitle = Types.pString(oData["Title"]);
	this.sShareItProductId = Types.pString(oData[sModuleName + "::ShareItProductId"]);
	this.sCrmProductId = Types.pString(oData[sModuleName + "::CrmProductId"]);
	this.bIsAutocreated = !!oData[sModuleName + "::IsAutocreated"];
	this.sPayPalItem = Types.pString(oData[sModuleName + "::PayPalItem"]);
	this.dProductPrice = Types.pDouble(oData['Price']).toFixed(2);
	this.sHomepage = Types.pString(oData['Homepage']);
	this.sProductGroupTitle = Types.pString(oData['ProductGroupTitle'], this.sProductGroupTitle);
	this.sMailchimpGroupTitle = Types.pString(oData[sModuleName + "::MailchimpGroupTitle"]);
	this.sMailchimpGroupUUID = Types.pString(oData[sModuleName + "::MailchimpGroupUUID"]);
};

module.exports = CProductsListItemModel;