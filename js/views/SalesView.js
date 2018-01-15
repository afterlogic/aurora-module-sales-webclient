'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	moment = require('moment'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	CSalesListItemModel = require('modules/%ModuleName%/js/models/CSalesListItemModel.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	Chart = require('modules/%ModuleName%/js/vendor/chart.js'),
	ModuleErrors = require('%PathToCoreWebclientModule%/js/ModuleErrors.js'),
	
	Enums = window.Enums
;

/**
 * View that is used as screen of sales module.
 * 
 * @constructor
 */
function CSalesView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.objectList = ko.observableArray([]);
	this.chartObjectList = ko.observableArray([]);
	this.objectsCount = ko.observable(0);
	this.selectedObject = ko.observable(null);
	this.searchFocused = ko.observable(false);
	this.searchInputValue = ko.observable('');
	this.searchValue = ko.observable('');
	this.searchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.searchValue(),
			'COUNT': this.objectsCount()
		});
	}, this);
	this.oSelector = new CSelector(
		this.objectList,
		_.bind(this.viewSalesItem, this)
	);
	this.isSearch = ko.computed(function () {
		return this.searchValue() !== '';
	}, this);
	this.currentPage = ko.observable(1);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ItemsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentPage(iCurrentpage);
		this.requestSalesList();
	}, this);
	this.listLoading = ko.observable(false);
	this.isVisible =  ko.observable(true);
	this.isUpdating = ko.observable(false);
	this.saveSale = _.bind(this.saveSale, this);
	this.selectedObject.subscribe(_.bind(function () {
		this.isUpdating(false);
	}, this));
	this.isSalesUpdating = ko.observable(false);
	this.isParsePaypalDone = ko.observable(false);
	this.isParseShareitDone = ko.observable(false);
	
	this.chartListLoading = ko.observable(false);
	this.currentRange = ko.observable();
	this.chartCont = ko.observable(null);
	this.rangeType = ko.observable(Enums.ChartRangeTypes.Month);
	
	this.refreshCommand = Utils.createCommand(this, function () {
		this.requestSalesList();
		this.changeRange(this.rangeType());
	});
	this.refreshIndicator = ko.observable(true).extend({ throttle: 50 });
	ko.computed(function () {
		this.refreshIndicator(this.listLoading() || this.chartListLoading());
	}, this);
}

_.extendOwn(CSalesView.prototype, CAbstractScreenView.prototype);

CSalesView.prototype.ViewTemplate = '%ModuleName%_SalesView';
CSalesView.prototype.EditViewTemplate = '%ModuleName%_SalesEditView';
CSalesView.prototype.ViewConstructorName = 'CSalesView';

/**
 * Called every time when screen is shown.
 */
CSalesView.prototype.onShow = function ()
{
	this.requestSalesList();
	this.getProductsList  = ko.computed(function () {
		if (this.selectedObject() && this.selectedObject().oProduct.sProductTitle === '' && this.selectedObject().sPayPalItem !== '')
		{
			return _.filter(this.productsFullList(), _.bind(function(oProduct) {
				return oProduct.sPayPalItem === this.selectedObject().sPayPalItem || oProduct.id === 0;
			}, this));
		}
		return this.productsFullList();
	}, this);
};

CSalesView.prototype.requestSearchSalesList = function (sSearch)
{
	this.searchInputValue(sSearch);
	this.requestSalesList();
};

CSalesView.prototype.requestSalesList = function ()
{
	this.listLoading(true);
	this.searchValue(this.searchInputValue());
	Ajax.send(
		'Sales',
		'GetSales', 
		{
			'Offset': (this.currentPage() - 1) * Settings.ItemsPerPage,
			'Limit': Settings.ItemsPerPage,
			'Search': this.searchValue()
		},
		this.onGetSalesResponse,
		this
	);
};

CSalesView.prototype.onGetSalesResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		var
			iItemsCount = Types.pInt(oResult.ItemsCount),
			iSelectedId = this.selectedObject() ? this.selectedObject().id : 0,
			oSelectedObj = null,
			aNewCollection = oResult.Sales ? _.compact(_.map(oResult.Sales, function (oItemData) {
				var oItem = new CSalesListItemModel();
				oItem.parse(oItemData, oResult.Customers, oResult.Products);
				if (oItem.id === iSelectedId)
				{
					oSelectedObj = oItem;
					oSelectedObj.selected(true);
				}
				return oItem;
			})) : []
		;
		this.objectList(aNewCollection);
		this.selectedObject(oSelectedObj);
		this.oSelector.itemSelected(oSelectedObj);
		this.objectsCount(iItemsCount);
		this.oPageSwitcher.setCount(iItemsCount);
	}
	else
	{
		this.objectList([]);
		this.objectsCount(0);
	}
	
	this.listLoading(false);
};

CSalesView.prototype.viewSalesItem = function (oItem)
{
	this.selectedObject(oItem);
};

CSalesView.prototype.onBind = function ()
{
	this.oSelector.initOnApplyBindings(
		'.sales_sub_list .item',
		'.sales_sub_list .selected.item',
		'.sales_sub_list .selected.item',
		$('.sales_list', this.$viewDom),
		$('.sales_list_scroll.scroll-inner', this.$viewDom)
	);
	
	this.initChart();
};

CSalesView.prototype.changeRange = function (sRangeType)
{
	var
		oStartMoment = moment(),
		oEndMoment = moment()
	;
	
	this.rangeType(sRangeType);
	
	switch (this.rangeType())
	{
		case Enums.ChartRangeTypes.Week:
			oStartMoment.subtract(7, 'days');
			break;
		case Enums.ChartRangeTypes.Month:
			oStartMoment.subtract(30, 'days');
			break;
		case Enums.ChartRangeTypes.Year:
			oStartMoment.subtract(12, 'months');
			break;
	}
	
	this.chartListLoading(true);
	
	Ajax.send(
		'Sales',
		'GetChartSales', 
		{
			'FromDate': oStartMoment.format('YYYY-MM-DD'),
			'TillDate': oEndMoment.format('YYYY-MM-DD'),
			'Search': this.searchValue()
		},
		function (oResponse) {
			var oResult = oResponse.Result;
			
			if (oResult)
			{
				this.chartObjectList(oResult);
			}
			
			this.chartListLoading(false);
		},
		this
	);
};

CSalesView.prototype.getSpecificDateRange = function (oBaseMoment, iPointsCount, sIntervalType, sDateFormat)
{
	var 
		oResult = {},
		oStartMoment = oBaseMoment.subtract(iPointsCount + 1, sIntervalType)
	;
	
	_(iPointsCount + 1).times(function () {
		var oDay = oStartMoment.add(1, sIntervalType);
		oResult[oDay.format(sDateFormat)] = 0;
	});

	return oResult;
};

CSalesView.prototype.initChart = function ()
{
	if (this.chartCont() && this.chartCont()[0])
	{
		var oChartCont = this.chartCont()[0];
		
		this.oChart = new Chart(oChartCont, {
            type: 'line',
			data: {
				datasets: [
					{
						label: 'General',
						backgroundColor: [
							'rgba(120, 184, 240, 0.5)'
						],
						borderColor: [
							'rgba(120, 184, 240, 1)'
						],
						pointBackgroundColor: 'rgba(120, 184, 240, 1)',
						pointHoverBackgroundColor: 'rgba(120, 184, 240, 1)',
						pointHoverBorderColor: 'rgba(40, 123, 139, 1)',
						borderWidth: 1,
						pointRadius: 3,
						pointBorderWidth: 1,
						pointHoverRadius: 5,
						lineTension: 0
					}
				]
			},
			options: {
				maintainAspectRatio: false,
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero:true
						}
					}]
				},
				legend: {
					display: false
				},
				tooltips: {
					displayColors: false,
					backgroundColor: 'rgba(40, 123, 139, 1)'
				},
				animation: {
					duration: 0
				}
			}
		});
	}
	
	this.chartObjectList.subscribe(function (aSales) {
		if (this.oChart)
		{
			var 
				oGroupedSales,
				oRangePoints,
				oNowMoment = moment(),
				sDisplayRange = ''
			;

			switch (this.rangeType())
			{
				case Enums.ChartRangeTypes.Week:
					oRangePoints = this.getSpecificDateRange(oNowMoment, 7, 'days', Settings.MMDDDateFormat);
					sDisplayRange = oNowMoment.subtract(7, 'days').format(Settings.FullDateFormat) + ' / ' 
							+ oNowMoment.format(Settings.FullDateFormat);
					
					aSales.forEach(function (oSalesItem) {
						oSalesItem.Date = moment(oSalesItem.Date).format(Settings.MMDDDateFormat);
					});
					break;
				case Enums.ChartRangeTypes.Month:
					oRangePoints = this.getSpecificDateRange(oNowMoment, 30, 'days', Settings.MMDDDateFormat);
					sDisplayRange = oNowMoment.subtract(30, 'days').format(Settings.FullDateFormat) + ' / ' 
							+ oNowMoment.format(Settings.FullDateFormat);
					
					aSales.forEach(function (oSalesItem) {
						oSalesItem.Date = moment(oSalesItem.Date).format(Settings.MMDDDateFormat);
					});
					break;
				case Enums.ChartRangeTypes.Year:
					oRangePoints = this.getSpecificDateRange(oNowMoment, 12, 'months', Settings.YYMMDateFormat);
					sDisplayRange = oNowMoment.subtract(12, 'months').format(Settings.FullDateFormat) + ' / ' 
							+ oNowMoment.format(Settings.FullDateFormat);
					
					aSales.forEach(function (oSalesItem) {
						oSalesItem.Date = moment(oSalesItem.Date).format(Settings.YYMMDateFormat);
					});
					break;
			}
			this.currentRange(sDisplayRange);
			oGroupedSales = _.extendOwn(_.clone(oRangePoints), _.countBy(aSales, 'Date'));
            this.oChart.data.datasets[0].data = _.values(oGroupedSales);
			this.oChart.data.labels = _.keys(oRangePoints);
			this.oChart.update();
		}
	}, this);
	
	this.searchValue.subscribe(function () {
		this.changeRange(this.rangeType());
	}, this);
	
	this.changeRange(Enums.ChartRangeTypes.Month);
};

CSalesView.prototype.salesSearchSubmit = function ()
{
	this.oPageSwitcher.currentPage(1);
	this.requestSalesList();
};

CSalesView.prototype.onClearSalesSearchClick = function ()
{
	// initiation empty search
	this.searchInputValue('');
	this.searchValue('');
	this.salesSearchSubmit();
};

CSalesView.prototype.show = function ()
{
	this.isVisible(true);
};

CSalesView.prototype.hide = function ()
{
	this.isVisible(false);
};

CSalesView.prototype.saveSale = function ()
{
	if (this.selectedObject().id !== 0)
	{
		this.isUpdating(true);
		Ajax.send(
			'Sales',
			'UpdateSale', 
			{
				'SaleId': this.selectedObject().id,
				'ProductIdOrUUID': this.selectedObject().oProduct.id
			},
			this.onGetSaleUpdateResponse,
			this
		);
	}
};

CSalesView.prototype.onGetSaleUpdateResponse = function (oResponse)
{
	var
		oResult = oResponse.Result,
		sMessage = ''
	;

	this.isUpdating(false);

	if (oResult)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DATA_UPDATE_SUCCESS'));
	}
	else
	{
		sMessage = ModuleErrors.getErrorMessage(oResponse);
		if (sMessage)
		{
			Screens.showError(sMessage);
		}
		else
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_DATA_UPDATE'));
		}
	}
	this.requestSalesList();
};

CSalesView.prototype.parseSales = function ()
{
	this.isSalesUpdating(true);
	$.ajax({
		url: '/modules/Sales/Crons/parse_shareit.php',
		type: 'POST',
		async: true,
		dataType: 'json',
		success: _.bind(function (data) {
			this.isParseShareitDone(true); 
			if (data.result === true)
			{
				Screens.showReport(TextUtils.i18n('%MODULENAME%/ACTION_PARSE_DONE'));
			}
			else
			{
				Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PARSE_SHAREIT'));
			}
			if (this.isParsePaypalDone())
			{
				this.parseSalesDone();
			}
		}, this),
		error: _.bind(function() {
			if (!this.isParsePaypalDone())
			{
				this.isParseShareitDone(true); 
			}
			else
			{
				this.parseSalesDone();
			}
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PARSE_SHAREIT'));
		}, this),
		timeout: 50000
	});
	$.ajax({
		url: '/modules/Sales/Crons/parse_paypal.php',
		type: 'POST',
		async: true,
		dataType: 'json',
		success: _.bind(function (data) {
			this.isParsePaypalDone(true);
			if (data.result === true)
			{
				Screens.showReport(TextUtils.i18n('%MODULENAME%/ACTION_PARSE_DONE'));
			}
			else
			{
				Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PARSE_PAYPAL'));
			}
			if (this.isParseShareitDone())
			{
				this.parseSalesDone();
			}
		}, this),
		error: _.bind(function() {
			if (!this.isParseShareitDone())
			{
				this.isParsePaypalDone(true); 
			}
			else
			{
				this.parseSalesDone();
			}
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_PARSE_PAYPAL'));
		}, this),
		timeout: 50000
	});
};

CSalesView.prototype.parseSalesDone = function ()
{
	this.isParsePaypalDone(false);
	this.isParseShareitDone(false);
	this.isSalesUpdating(false);
	this.requestSalesList();
};

CSalesView.prototype.getBigButtonText = function ()
{
	return this.isSalesUpdating() ? TextUtils.i18n('COREWEBCLIENT/INFO_LOADING') : TextUtils.i18n('%MODULENAME%/ACTION_PARSE_SALES');
};

CSalesView.prototype.getPaymentSystem = function ()
{
	var sResult = '';

	if (this.selectedObject() !== null)
	{
		switch (this.selectedObject().iPaymentSystem)
		{
			case Enums.PaymentSystemTypes.ShareIt:
				sResult = TextUtils.i18n('%MODULENAME%/INFO_PAYMENT_SYSTEM_SHAREIT');
				break;
			case Enums.PaymentSystemTypes.PayPal:
				sResult = TextUtils.i18n('%MODULENAME%/INFO_PAYMENT_SYSTEM_PAYPAL');
				break;
			case Enums.PaymentSystemTypes.Download:
				sResult = TextUtils.i18n('%MODULENAME%/INFO_PAYMENT_SYSTEM_DOWNLOAD');
				break;
		}
	}
	return sResult;
};

CSalesView.prototype.getProductGroup = function ()
{
	var
		sResult = '',
		oGroup = null
	;

	if (this.selectedObject() && this.selectedObject().oProduct && this.selectedObject().oProduct.sProductGroupUUID)
	{
		oGroup = _.find(this.productGroupsFullList(), _.bind(function(oProductsGroup) {
			return oProductsGroup.UUID === this.selectedObject().oProduct.sProductGroupUUID;
		}, this));
		if (oGroup && oGroup.sTitle)
		{
			sResult = oGroup.sTitle;
		}
	}
	return sResult;
};

module.exports = new CSalesView();
