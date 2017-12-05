'use strict';

var
	_ = require('underscore'),
	Enums = {}
;

/**
 * @enum {number}
 */
Enums.SalesStorages = {
	'Sales': 'sales',
	'Products': 'products',
	'ProductGroups': 'product_groups'
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
