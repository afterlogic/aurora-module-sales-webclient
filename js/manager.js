'use strict';

module.exports = function (oAppData) {
	require('modules/%ModuleName%/js/enums.js');
	
	var
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		sHashModuleName = 'sales'
	;
	
	if (App.getUserRole() === Enums.UserRole.NormalUser)
	{
		var
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
				
				oScreens[sHashModuleName] = function () {
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
					name: sHashModuleName
				};
			}
		};
	}
	
	return null;
};
