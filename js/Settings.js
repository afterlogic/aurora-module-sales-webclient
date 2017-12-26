'use strict';

var UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js');

module.exports = {
	ItemsPerPage: 20,
	
	FullDateFormat: 'YYYY-MM-DD',
	YYMMDateFormat: 'YYYY-MM',
	MMDDDateFormat: 'MM-DD',
	
	getTimeFormat: function ()
	{
		return (UserSettings.timeFormat() === window.Enums.TimeFormat.F24) ? 'HH:mm' : 'hh:mm A';
	}
};
