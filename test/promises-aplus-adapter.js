(function() {
	'use strict';

	if(typeof exports === 'object') {

		var when = require('../when');

		exports.resolved = when.resolve;
		exports.rejected = when.reject;
		exports.deferred = when.defer;
	}
})();
