(function() {
	'use strict';

	if(typeof exports === 'object') {

		var when = require('../when');

		// Silence potentially unhandled rejections
		when.Promise.onPotentiallyUnhandledRejection = function() {};

		exports.resolved = when.resolve;
		exports.rejected = when.reject;
		exports.deferred = when.defer;
	}
})();
