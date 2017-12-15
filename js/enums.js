'use strict';

var
	_ = require('underscore'),
	Enums = {}
;

/**
 * @enum {number}
 */
Enums.SalesObjectsTypes = {
	'Sales': 'sales',
	'Products': 'products',
	'ProductGroups': 'product_groups',
	'Contacts': 'contacts',
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
