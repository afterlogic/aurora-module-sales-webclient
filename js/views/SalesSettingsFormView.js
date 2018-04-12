'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CSalesSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.title = ko.observable(Settings.Title());
	this.description = ko.observable(Settings.Description());
	this.listId = ko.observable(Settings.ListId());
}

_.extendOwn(CSalesSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CSalesSettingsFormView.prototype.ViewTemplate = '%ModuleName%_SalesSettingsFormView';

CSalesSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.title(),
		this.description(),
		this.listId()
	];
};

CSalesSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'Title': this.title(),
		'Description': this.description(),
		'ListId': this.listId()
	};
};

CSalesSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	Settings.update(oParameters.Title, oParameters.Description, oParameters.ListId);
};

module.exports = new CSalesSettingsFormView();
