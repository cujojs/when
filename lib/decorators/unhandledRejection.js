/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var async = require('../async');

	return function unhandledRejection(Promise) {
		var logError = (function() {
			if(typeof console !== 'undefined') {
				if(typeof console.error !== 'undefined') {
					return function(e) {
						console.error(e);
					};
				}

				return function(e) {
					console.log(e);
				};
			}

			return noop;
		}());

		Promise.onPotentiallyUnhandledRejection = function(rejection) {
			logError('Potentially unhandled rejection ' + formatError(rejection.value));
		};

		Promise.onFatalRejection = function(rejection) {
			async(function() {
				throw rejection.value;
			});
		};

		return Promise;
	};

	function formatError(e) {
		var s;
		if(typeof e === 'object' && e.stack) {
			s = e.stack;
		} else {
			s = String(e);
			if(s === '[object Object]' && typeof JSON !== 'undefined') {
				s = tryStringify(e, s);
			}
		}

		return e instanceof Error ? s : s + ' (WARNING: non-Error used)';
	}

	function tryStringify(e, defaultValue) {
		try {
			return JSON.stringify(e);
		} catch(e) {
			// Ignore. Cannot JSON.stringify e, stick with String(e)
			return defaultValue;
		}
	}

	function noop() {}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
