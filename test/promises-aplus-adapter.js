(function() {
	'use strict';

	if(typeof exports === 'object') {

		var when = require('../when');

		exports.fulfilled = when.resolve;
		exports.rejected = when.reject;

		exports.pending = function () {
			var pending = {};

			pending.promise = when.promise(function(resolve, reject) {
				pending.fulfill = resolve;
				pending.reject = reject;
			});

			return pending;
		};
	}
})();
