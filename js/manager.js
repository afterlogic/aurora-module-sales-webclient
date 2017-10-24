'use strict';

module.exports = function (oAppData) {
	var
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		sModuleName = 'sales'
	;
	
	if (App.getUserRole() === Enums.UserRole.NormalUser)
	{
		var
			_ = require('underscore'),

			TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
			HeaderItemView = null
		;

		return {
			/**
			 * Returns list of functions that are return module screens.
			 * 
			 * @returns {Object}
			 */
			getScreens: function ()
			{
				var oScreens = {};
				
				oScreens[sModuleName] = function () {
					return require('modules/%ModuleName%/js/views/MainView.js');
				};
				
				return oScreens;
			},
			/**
			 * Returns object of header item view of sales module.
			 * 
			 * @returns {Object}
			 */
			getHeaderItem: function () {
				if (HeaderItemView === null)
				{
					var CHeaderItemView = require('%PathToCoreWebclientModule%/js/views/CHeaderItemView.js');
					HeaderItemView = new CHeaderItemView(TextUtils.i18n('%MODULENAME%/ACTION_SHOW_SALES'));
				}

				return {
					item: HeaderItemView,
					name: sModuleName
				};
			}
		};
	}
	
	return null;
};
