'use strict';

var
	_ = require('underscore'),
	Enums = {}
;

/**
 * @enum {string}
 */
Enums.SalesObjectsTypes = {
	'Sales': 'sales',
	'Downloads': 'downloads',
	'Products': 'products',
	'ProductGroups': 'product_groups',
	'Contacts': 'contacts'
};

/**
 * @enum {string}
 */
Enums.ChartRangeTypes = {
	'Week': 'week',
	'Month': 'month',
	'Year': 'year'
};

/**
 * @enum {number}
 */
Enums.PaymentSystemTypes = {
	'ShareIt': 1,
	'PayPal': 2,
	'Download': 3
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
