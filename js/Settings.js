'use strict';

var UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js');

module.exports = {
	ItemsPerPage: 20,
	HashModuleName: 'sales',
	
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
//		var
//			oAppDataMailSection = oAppData[this.ServerModuleName],
//			oAppDataMailWebclientSection = oAppData['%ModuleName%']
//		;
		
//		if (!_.isEmpty(oAppDataMailSection))
//		{
//			this.AllowAddAccounts = Types.pBool(oAppDataMailSection.AllowAddAccounts, this.AllowAddAccounts);
//		}
	},
	
	getTimeFormat: function ()
	{
		return (UserSettings.timeFormat() === window.Enums.TimeFormat.F24) ? 'HH:mm' : 'hh:mm A';
	}
};
