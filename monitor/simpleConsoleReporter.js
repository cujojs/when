/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define(function() {

	return function simpleReporter(format) {
		var timeout;

		return function(promises) {
			if(timeout == null) {
				timeout = setTimeout(function() {
					timeout = null;
					logPromises(promises);
				}, 250);
			}
		};

		function logPromises(promises) {
			var pending, rejected;

			pending = [];

			var rejected = promises.reduce(function(rejected, rec) {
				var formatted = format(rec);

				if(rec.rejectedAt) {
					rejected.push(formatted);
				} else {
					pending.push(formatted);
				}

				return rejected;
			}, []);

			console.warn('[when] Pending, unobserved promises', pending);
			console.warn('[when] Unhandled, rejected promises', rejected);
		}
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
