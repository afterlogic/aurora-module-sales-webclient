'use strict';

var
	ko = require('knockout'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * @constructor
 */
function CProductGroupsListItemModel()
{	
	this.id = '';
	this.UUID = '';
	
	this.sTitle = '';
	this.sDescription = '';
	this.sHomepage = '';
	
	this.sProductCode = '';

	this.selected = ko.observable(false);
	this.checked = ko.observable(false);
}

/**
 *
 * @param {Object} oData
 */
CProductGroupsListItemModel.prototype.parse = function (oData)
{
	var
		sModuleName = 'Sales'
	;

	this.id =  Types.pInt(oData['EntityId']);
	this.UUID =  Types.pString(oData['UUID']);
	
	this.sTitle = Types.pString(oData["Title"]);
	this.sDescription = Types.pString(oData["Description"]);
	this.sHomepage = Types.pString(oData["Homepage"]);
	
	this.sProductCode = Types.pString(oData[sModuleName + "::ProductCode"]);
};

module.exports = CProductGroupsListItemModel;