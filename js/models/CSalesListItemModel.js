'use strict';

var
	ko = require('knockout'),
	moment = require('moment'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	CProductsListItemModel = require('modules/%ModuleName%/js/models/CProductsListItemModel.js'),
	
	Enums = window.Enums
;

/**
 * @constructor
 */
function CSalesListItemModel()
{	
	this.id = 0;
	this.UUID = '';
	this.sDate = '';
	this.sLicenseKey = '';
	this.dNetTotal = 0;
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
	this.sMessageSubject = '';
	this.sDowloadUrl = '';
	this.iParsingStatus = 0;
	this.bIsEmlAvailable = false;
	this.sTransactionId = '';
	this.sReseller = '',
	this.sPromotionName = '',
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
	this.sCity = '';
	this.sCountry = '';

	// Product section
	this.oProduct = null;

	// Customer section
	this.iCustomerId = 0;
	this.sCustomerUUID = '';
	this.sTitle = '';
	this.sDescription = '';
	this.iStatus = 0;
	this.sLanguage = '';
	this.bNotify = true;
	this.bGotGreeting = true;
	this.bGotGreeting2 = true;
	this.bGotSurvey = true;
	this.bIsSale = true;
	// Contact section
	this.iContactId = 0;
	this.sContactUUID = '';
	this.sFullName = '';
	this.sAddress = '';
	this.sPhone = '';
	this.sEmail = '';
	this.sFacebook = '';
	this.sLinkedIn = '';
	this.sInstagram = '';
	this.sFax = '';
	this.sSalutation = '';
	this.sLastName = '';
	this.sFirstName = '';
	// Company section
	this.iCompanyId = 0;
	this.sCompanyUUID = '';
	this.sCompanyTitle = '';
	this.sCompanyDescription = '';
	this.sCompanyAddress = '';
	this.sCompanyPhone = '';
	this.sCompanyWebsit = '';

	this.selected = ko.observable(false);
	this.checked = ko.observable(false);
	this.parsed = ko.observable(false);
	this.nedAttention = ko.observable(false);
	this.bIsSalesProductEditing = ko.observable(false);
	this.bIsCompany = ko.observable(false);
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
	this.dNetTotal = Types.pDouble(oData['Price'], this.dNetTotal).toFixed(2);
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
	this.sMessageSubject = Types.pString(oData[sModuleName + '::MessageSubject'], this.sMessageSubject);
	this.sDowloadUrl = '?download-sale-eml/' + this.UUID;
	this.iParsingStatus = Types.pInt(oData[sModuleName + '::ParsingStatus'], this.iParsingStatus);
	this.parsed(this.iParsingStatus !== Enums.ParsingStatus.NotParsed);
	this.nedAttention(this.iParsingStatus === Enums.ParsingStatus.ParsedWithWarning);
	this.bIsEmlAvailable = !!oData['IsEmlAvailable'];
	this.sTransactionId = Types.pString(oData[sModuleName + '::TransactionId'], this.sTransactionId);
	this.sReseller = Types.pString(oData[sModuleName + '::Reseller'], this.sReseller);
	this.sPromotionName = Types.pString(oData[sModuleName + '::PromotionName'], this.sPromotionName);
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
	this.sCity = Types.pString(oData['City'], this.sCity);
	this.sCountry = Types.pString(oData['Country'], this.sCountry);

	if (oCustomer !== null)
	{
		// TODO: store Customer & Contact as objects
		this.iCustomerId = Types.pInt(oCustomer['EntityId'], this.iCustomerId);
		this.sCustomerUUID = Types.pString(oCustomer['UUID'], this.sCustomerUUID);
		this.sTitle = Types.pString(oCustomer['Title'], this.sTitle);
		this.sDescription = Types.pString(oCustomer['Description'], this.sDescription);
		this.iStatus = Types.pInt(oCustomer['Status'], this.iStatus);
		this.sLanguage = Types.pString(oCustomer[sModuleName + '::Language'], this.sLanguage);
		this.bNotify = Types.pBool(oData['Notify'], this.bNotify);
		this.bGotGreeting = Types.pBool(oData['GotGreeting'], this.bGotGreeting);
		this.bGotGreeting2 = Types.pBool(oData['GotGreeting2'], this.bGotGreeting2);
		this.bGotSurvey = Types.pBool(oData['GotSurvey'], this.bGotSurvey);
		this.bIsSale = Types.pBool(oData['IsSale'], this.bIsSale);
		// Contact section
		this.iContactId = Types.pInt(oCustomer[sModuleName + '::ContactId'], this.iContactId);
		this.sContactUUID = Types.pString(oCustomer[sModuleName + '::ContactUUID'], this.sContactUUID);
		this.sFullName = Types.pString(oCustomer[sModuleName + '::FullName'], this.sFullName);
		this.sAddress  = Types.pString(oCustomer[sModuleName + '::Address'], this.sLanguage);
		this.sPhone = Types.pString(oCustomer[sModuleName + '::Phone'], this.sPhone);
		this.sEmail = Types.pString(oCustomer[sModuleName + '::Email'], this.sEmail);
		this.sFacebook = Types.pString(oCustomer[sModuleName + '::Facebook'], this.sFacebook);
		this.sLinkedIn = Types.pString(oCustomer[sModuleName + '::LinkedIn'], this.sLinkedIn);
		this.sInstagram = Types.pString(oCustomer[sModuleName + '::Instagram'], this.sInstagram);
		this.sFax = Types.pString(oCustomer[sModuleName + '::Fax'], this.sFax);
		this.sSalutation = Types.pString(oCustomer[sModuleName + '::Salutation'], this.sSalutation);
		this.sLastName = Types.pString(oCustomer[sModuleName + '::LastName'], this.sLastName);
		this.sFirstName = Types.pString(oCustomer[sModuleName + '::FirstName'], this.sFirstName);
		// Company section
		this.iCompanyId = Types.pInt(oCustomer[sModuleName + '::Company_Id'], this.iCompanyId);
		this.sCompanyUUID = Types.pString(oCustomer[sModuleName + '::Company_UUID'], this.sCompanyUUID);
		this.sCompanyTitle = Types.pString(oCustomer[sModuleName + '::Company_Title'], this.sCompanyTitle);
		this.sCompanyDescription = Types.pString(oCustomer[sModuleName + '::Company_Description'], this.sCompanyDescription);
		this.sCompanyAddress = Types.pString(oCustomer[sModuleName + '::Company_Address'], this.sCompanyAddress);
		this.sCompanyPhone = Types.pString(oCustomer[sModuleName + '::Company_Phone'], this.sCompanyPhone);
		this.sCompanyWebsit = Types.pString(oCustomer[sModuleName + '::Company_Websit'], this.sCompanyWebsit);
		this.bIsCompany(!!this.sCompanyTitle || !!this.sCompanyDescription || !!this.sCompanyAddress || !!this.sCompanyPhone || !!this.sCompanyWebsit);
	}

	this.oProduct = new CProductsListItemModel();
	if (oProduct !== null)
	{
		this.oProduct.parse(oProduct);
	}
};

module.exports = CSalesListItemModel;
