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

	return function createAggregator(reporter) {
		var promises, aggregator;

		aggregator = {
			reset: reset,
			report: report,
			promisePending: promisePending,
			promiseResolved: promiseResolved,
			unhandledRejection: unhandledRejection,
			handledRejection: handledRejection
		}

		reset();

		return aggregator;

		function promisePending(promise) {
			var stackHolder;
			try {
				throw new Error();
			} catch(e) {
				stackHolder = e;
			}

			promises.push({ promise: promise, timestamp: +(new Date()), createdAt: stackHolder });
		}

		function promiseResolved(promise) {
			removeFromList(promises, promise);
			report();
		}

		function unhandledRejection(promise, reason) {
			var stackHolder;
			try {
				throw new Error(reason && reason.message || reason);
			} catch(e) {
				stackHolder = e;
			}

			promises.some(function(rec, i) {
				if(promise === rec.promise) {
					rec.reason = reason;
					rec.rejectedAt = stackHolder;
					return true;
				}
			});

			report();
		};

		function handledRejection(promise) {
			removeFromList(promises, promise);
		}

		function report() {
			reporter(promises);
		}

		function reset() {
			promises = [];
		}
	}

	function removeFromList(list, promise) {
		list.some(function(rec, i) {
			if(rec.promise === promise) {
				list.splice(i, 1);
				return true;
			}
		});
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
