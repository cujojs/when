/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var timer = require('../timer');

	return function unhandledRejection(Promise) {
		var unhandledRejections = [];
		var unhandledRejectionTimer;

		function reportUnhandledRejections() {
			unhandledRejectionTimer = void 0;
			unhandledRejections.forEach(function (r) {
				if(!r.handled) {
					var msg = 'Maybe unhandled rejection '
						+ formatError(r.value);
					reportError(msg);
				}
			});
			unhandledRejections = [];
		}

		Promise.onUnhandledRejection = function(rejection) {
			unhandledRejections.push(rejection);
			if(!unhandledRejectionTimer) {
				unhandledRejectionTimer = timer.set(reportUnhandledRejections, 0);
			}
		};

		Promise.onUnhandledRejectionHandled = function(/*rejection*/) {};

		Promise.onFatalRejection = function(rejection) {
			timer.set(function() {
				throw rejection.value;
			}, 0);
		};

		return Promise;
	};

	function formatError(e) {
		if(typeof e === 'object' &&
			e.name !== void 0 && e.message !== void 0) {
			return e.stack || (e.name + ': ' + e.message);
		}

		return e;
	}

	function reportError(msg) {
		if(typeof console !== 'undefined') {
			if(typeof console.error !== 'undefined') {
				console.error(msg);
			} else if(typeof console.log !== 'undefined') {
				console.log(msg);
			}
		}
	}


});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
