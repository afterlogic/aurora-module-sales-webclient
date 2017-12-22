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

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
