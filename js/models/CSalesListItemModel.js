'use strict';

var
	ko = require('knockout'),
	moment = require('moment'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	CProductsListItemModel = require('modules/%ModuleName%/js/models/CProductsListItemModel.js')
;

/**
 * @constructor
 */
function CSalesListItemModel()
{	
	this.id = '';
	this.UUID = '';
	this.sDate = '';
	this.sLicenseKey = '';
	this.iNetTotal = 0;
	this.sMaintenanceExpirationDate = '';
	this.sPayPalItem = '';
	this.sVatId = '';
	this.sPayment = '';
	this.iRefNumber = 0;
	this.sShareItPurchaseId = '';
	this.bIsNotified = false;
	this.bRecurrentMaintenance = true;
	this.bTwoMonthsEmailSent = false;
	this.iParentSaleId = 0;
	this.iPaymentSystem = 0;
	this.iNumberOfLicenses = 0;
	// Download section
	this.iDownloadId = 0;
	this.sReferer = '';
	this.sIp = '';
	this.sGad = '';
	this.sProductVersion = '';
	this.sLicenseType = 0;
	this.sReferrerPage = 0;
	this.bIsUpgrade = false;
	this.iPlatformType = 0;

	// Product section
	this.oProduct = null;

	// Customer section
	this.iCustomerId = 0;
	this.sEmail = '';
	this.sCustomerRegName = '';
	this.sPhone = '';
	this.sLanguage = '';
	this.sAddress = '';

	this.selected = ko.observable(false);
	this.checked = ko.observable(false);
}

CSalesListItemModel.prototype.parse = function (oData, aCustomers, aProducts)
{
	var
		sModuleName = 'Sales',
		oCustomer = typeof aCustomers[oData['CustomerUUID']] !== 'undefined' ? aCustomers[oData['CustomerUUID']] : null,
		oProduct = typeof aProducts[oData['ProductUUID']] !== 'undefined' ? aProducts[oData['ProductUUID']] : null
	;

	this.id =  Types.pInt(oData['EntityId'], this.id);
	this.UUID =  Types.pString(oData['UUID'], this.UUID);
	this.sDate =  moment(oData['Date']).format(Settings.FullDateFormat + ' ' + Settings.getTimeFormat());
	this.sLicenseKey = Types.pString(oData[sModuleName + '::LicenseKey'], this.sLicenseKey);
	this.iNetTotal = Types.pInt(oData['Price'], this.iNetTotal);
	this.sMaintenanceExpirationDate = Types.pString(oData[sModuleName + '::MaintenanceExpirationDate'], this.sMaintenanceExpirationDate);
	this.sPayPalItem = Types.pString(oData[sModuleName + '::PayPalItem'], this.sPayPalItem);
	this.sVatId = Types.pString(oData[sModuleName + '::VatId'], this.sVatId);
	this.sPayment = Types.pString(oData[sModuleName + '::Payment'], this.sPayment);
	this.iRefNumber = Types.pInt(oData[sModuleName + '::RefNumber'], this.iRefNumber);
	this.sShareItPurchaseId = Types.pString(oData[sModuleName + '::ShareItPurchaseId'], this.sShareItPurchaseId);
	this.bIsNotified = Types.pBool(oData[sModuleName + '::IsNotified'], this.bIsNotified);
	this.bRecurrentMaintenance = Types.pBool(oData[sModuleName + '::RecurrentMaintenance'], this.bRecurrentMaintenance);
	this.bTwoMonthsEmailSent = Types.pBool(oData[sModuleName + '::TwoMonthsEmailSent'], this.bTwoMonthsEmailSent);
	this.iParentSaleId = Types.pInt(oData[sModuleName + '::ParentSaleId'], this.iParentSaleId);
	this.iPaymentSystem = Types.pInt(oData[sModuleName + '::PaymentSystem'], this.iPaymentSystem);
	this.iNumberOfLicenses = Types.pInt(oData[sModuleName + '::NumberOfLicenses'], this.iNumberOfLicenses);
	// Download section
	this.iDownloadId = Types.pInt(oData[sModuleName + '::DownloadId'], this.iDownloadId);
	this.sReferer = Types.pString(oData[sModuleName + '::Referer'], this.sReferer);
	this.sIp = Types.pString(oData[sModuleName + '::Ip'], this.sIp);
	this.sGad = Types.pString(oData[sModuleName + '::Gad'], this.sGad);
	this.sProductVersion = Types.pString(oData[sModuleName + '::ProductVersion'], this.sProductVersion);
	this.iLicenseType = Types.pInt(oData[sModuleName + '::LicenseType'], this.iLicenseType);
	this.iReferrerPage = Types.pInt(oData[sModuleName + '::ReferrerPage'], this.iReferrerPage);
	this.bIsUpgrade = Types.pBool(oData[sModuleName + '::IsUpgrade'], this.bIsUpgrade);
	this.iPlatformType = Types.pInt(oData[sModuleName + '::PlatformType'], this.iPlatformType);

	if (oCustomer !== null)
	{
		this.iCustomerId = Types.pInt(oCustomer['EntityId'], this.iCustomerId);
		this.sEmail = Types.pString(oCustomer[sModuleName + '::Email'], this.sEmail);
		this.sCustomerRegName = Types.pString(oCustomer[sModuleName + '::FullName'], this.sCustomerRegName);
		this.sPhone = Types.pString(oCustomer[sModuleName + '::Phone'], this.sPhone);
		this.sLanguage = Types.pString(oCustomer[sModuleName + '::Language'], this.sLanguage);
		this.sAddress  = Types.pString(oCustomer[sModuleName + '::Address'], this.sLanguage);
	}
	
	this.oProduct = new CProductsListItemModel();
	if (oProduct !== null)
	{
		this.oProduct.parse(oProduct);
	}
};

module.exports = CSalesListItemModel;
