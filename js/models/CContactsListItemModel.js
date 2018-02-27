'use strict';

var
	ko = require('knockout'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * @constructor
 */
function CContactsListItemModel()
{
	this.id = "";
	this.UUID = "";

	this.sFullName = "";
	this.sAddress = "";
	this.sPhone = "";
	this.sEmail = "";
	this.sFacebook = "";
	this.sLinkedIn = "";
	this.sInstagram = "";
	this.sCustomerUUID = "";
	this.sCompanyUUID = "";
	this.sFax = "";
	this.sSalutation = "";
	this.sLastName = "";
	this.sFirstName = "";

	this.selected = ko.observable(false);
	this.checked = ko.observable(false);
}

/**
 *
 * @param {Object} oData
 */
CContactsListItemModel.prototype.parse = function (oData)
{
	var
		sModuleName = 'Sales'
	;

	this.id =  Types.pInt(oData['EntityId']);
	this.UUID =  Types.pString(oData['UUID']);

	this.sFullName = Types.pString(oData["FullName"]);
	this.sAddress = Types.pString(oData["Address"]);
	this.sPhone = Types.pString(oData["Phone"]);
	this.sEmail = Types.pString(oData["Email"]);
	this.sFacebook = Types.pString(oData["Facebook"]);
	this.sLinkedIn = Types.pString(oData["LinkedIn"]);
	this.sInstagram = Types.pString(oData["Instagram"]);
	this.sCustomerUUID = Types.pString(oData["CustomerUUID"]);
	this.sCompanyUUID = Types.pString(oData["CompanyUUID"]);
	this.sFax = Types.pString(oData[sModuleName + "::Fax"]);
	this.sSalutation = Types.pString(oData[sModuleName + "::Salutation"]);
	this.sLastName = Types.pString(oData[sModuleName + "::LastName"]);
	this.sFirstName = Types.pString(oData[sModuleName + "::FirstName"]);
};

module.exports = CContactsListItemModel;