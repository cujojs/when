/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var timer = require('../timer');

	var logError = (function() {
		if(typeof console !== 'undefined') {
			if(typeof console.error !== 'undefined') {
				return function(e) {
					console.error(e);
				};
			}

			if(typeof console.log !== 'undefined') {
				return function(e) {
					console.log(e);
				};
			}
		}

		return noop;
	}());

	return function unhandledRejection(Promise, enqueue) {
		var unhandledRejections = [];

		if(typeof enqueue !== 'function') {
			enqueue = function(f) {
				timer.set(f, 0);
			};
		}

		function reportUnhandledRejections() {
			unhandledRejections.forEach(function (r) {
				if(!r.handled) {
					logError('Potentially unhandled rejection ' + formatError(r.value));
				}
			});
			unhandledRejections = [];
		}

		Promise.onPotentiallyUnhandledRejection = function(rejection) {
			if(unhandledRejections.length === 0) {
				enqueue(reportUnhandledRejections);
			}
			unhandledRejections.push(rejection);
		};

		Promise.onFatalRejection = function(rejection) {
			enqueue(function() {
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
