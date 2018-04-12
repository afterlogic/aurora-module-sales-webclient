'use strict';

var 
	ko = require('knockout'),
	_ = require('underscore'),

	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ItemsPerPage: 20,
	HashModuleName: 'sales',
	ServerModuleName: 'Sales',
	Title: ko.observable(''),
	Description: ko.observable(''),
	ListId: ko.observable(''),
	
	FullDateFormat: 'YYYY-MM-DD',
	YYMMDateFormat: 'YYYY-MM',
	MMDDDateFormat: 'MM-DD',
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oAppDataSection = oAppData[this.ServerModuleName]
		;
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.Title(Types.pString(oAppDataSection.Title, this.Title()));
			this.Description(Types.pString(oAppDataSection.Description, this.Description()));
			this.ListId(Types.pString(oAppDataSection.ListId, this.ListId()));
		}
	},
	/**
	 * Updates new settings values after saving on server.
	 * 
	 * @param {boolean} bEnableJscrypto
	 * @param {number} iEncryptionMode
	 */
	update: function (sTitle, sDescription, sListId)
	{
		this.Title(sTitle);
		this.Description(sDescription);
		this.ListId(sListId);
	},
	
	getTimeFormat: function ()
	{
		return (UserSettings.timeFormat() === window.Enums.TimeFormat.F24) ? 'HH:mm' : 'hh:mm A';
	}
};
