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
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),

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
function CDownloadsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');

	this.objectList = ko.observableArray([]);
	this.chartObjectList = ko.observableArray([]);
	this.objectsCount = ko.observable(0);
	this.selectedObject = ko.observable(null);
	this.searchFocused = ko.observable(false);
	this.searchInputValue = ko.observable('');
	this.searchByProduct = ko.observable(null);
	this.searchValue = ko.observable('');
	this.searchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': (this.searchByProduct() !== null) ? this.searchByProduct().sProductTitle + ' | ' + this.searchByProduct().UUID: this.searchValue(),
			'COUNT': this.objectsCount()
		});
	}, this);
	this.oSelector = new CSelector(
		this.objectList,
		_.bind(this.viewDownloadsItem, this)
	);
	this.isSearch = ko.computed(function () {
		return this.searchValue() !== '' || this.searchByProduct() !== null;
	}, this);
	this.currentPage = ko.observable(1);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ItemsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function (iCurrentpage) {
		this.currentPage(iCurrentpage);
		this.requestDownloadsList();
	}, this);
	this.listLoading = ko.observable(false);
	this.isVisible =  ko.observable(false);
	this.isUpdating = ko.observable(false);
	this.saveDownloadBound = _.bind(this.saveDownload, this);
	this.selectedObject.subscribe(_.bind(function () {
		this.isUpdating(false);
	}, this));

	this.chartListLoading = ko.observable(false);
	this.currentRange = ko.observable();
	this.chartCont = ko.observable(null);
	this.rangeType = ko.observable(Enums.ChartRangeTypes.Month);

	this.refreshCommand = Utils.createCommand(this, function () {
		this.requestDownloadsList();
		this.changeRange(this.rangeType());
	});
	this.refreshIndicator = ko.observable(true).extend({ throttle: 50 });
	ko.computed(function () {
		this.refreshIndicator(this.listLoading() || this.chartListLoading());
	}, this);
	this.removeDownloadBound = _.bind(this.removeDownload, this);
}

_.extendOwn(CDownloadsView.prototype, CAbstractScreenView.prototype);

CDownloadsView.prototype.ViewTemplate = '%ModuleName%_DownloadsView';
CDownloadsView.prototype.EditViewTemplate = '%ModuleName%_DownloadsEditView';
CDownloadsView.prototype.ViewConstructorName = 'CDownloadsView';

/**
 * Called every time when screen is shown.
 */
CDownloadsView.prototype.onShow = function ()
{
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

CDownloadsView.prototype.requestSearchDownloadsList = function (sSearch)
{
	this.searchInputValue(sSearch);
	this.searchByProduct(null);
	this.requestDownloadsList();
};

CDownloadsView.prototype.requestDownloadsList = function ()
{
	this.listLoading(true);
	this.searchValue(this.searchInputValue());
	Ajax.send(
		'Sales',
		'GetSales', 
		{
			'Offset': (this.currentPage() - 1) * Settings.ItemsPerPage,
			'Limit': Settings.ItemsPerPage,
			'Search': this.searchValue(),
			'GetDownloads': true,
			'ProductUUID': (this.searchByProduct() !== null && this.searchByProduct().UUID) ?  this.searchByProduct().UUID : null
		},
		this.onGetDownloadsResponse,
		this
	);
};

CDownloadsView.prototype.onGetDownloadsResponse = function (oResponse)
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

CDownloadsView.prototype.viewDownloadsItem = function (oItem)
{
	this.selectedObject(oItem);
};

CDownloadsView.prototype.onBind = function ()
{
	this.oSelector.initOnApplyBindings(
		'.downloads_sub_list .item',
		'.downloads_sub_list .selected.item',
		'.downloads_sub_list .selected.item',
		$('.downloads_list', this.$viewDom),
		$('.downloads_list_scroll.scroll-inner', this.$viewDom)
	);
};

CDownloadsView.prototype.changeRange = function (sRangeType)
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
			'Search': this.searchValue(),
			'GetDownloads': true
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

CDownloadsView.prototype.getSpecificDateRange = function (oBaseMoment, iPointsCount, sIntervalType, sDateFormat)
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

CDownloadsView.prototype.initChart = function ()
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

CDownloadsView.prototype.downloadsSearchSubmit = function ()
{
	this.oPageSwitcher.currentPage(1);
	this.requestDownloadsList();
};

CDownloadsView.prototype.onClearDownloadsSearchClick = function ()
{
	// initiation empty search
	this.searchByProduct(null);
	this.searchInputValue('');
	this.searchValue('');
	this.downloadsSearchSubmit();
};

CDownloadsView.prototype.show = function ()
{
	if (this.objectList().length === 0)
	{
		this.requestDownloadsList();
		this.initChart();
	}
	this.isVisible(true);
};

CDownloadsView.prototype.hide = function ()
{
	this.isVisible(false);
};

CDownloadsView.prototype.saveDownload = function ()
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
			this.onGetDownloadUpdateResponse,
			this
		);
	}
};

CDownloadsView.prototype.onGetDownloadUpdateResponse = function (oResponse)
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
	this.requestDownloadsList();
};

CDownloadsView.prototype.getPaymentSystem = function ()
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

CDownloadsView.prototype.getProductGroup = function ()
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

CDownloadsView.prototype.removeDownload = function (oSale)
{
	if (oSale.UUID)
	{
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_SALE'),  _.bind(function(bConfirm) {
			if (bConfirm)
			{
				Ajax.send(
					'Sales',
					'DeleteSale', 
					{
						'UUID': oSale.UUID
					},
					this.onDeleteSaleResponse,
					this
				);
			}
		}, this), oSale.sMessageSubject]);
	}
};

CDownloadsView.prototype.onDeleteDownloadResponse = function (oResponse)
{
	var
		oResult = oResponse.Result,
		sMessage = ''
	;

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
	this.requestDownloadsList();
};

module.exports = new CDownloadsView();
