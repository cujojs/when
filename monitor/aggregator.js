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
		var promises;

		reset();

		return publish({ publish: publish });

		function promisePending(promise, parent) {
			var stackHolder, rec;
			try {
				throw new Error();
			} catch(e) {
				stackHolder = e;
			}

			rec = {
				promise: promise,
				timestamp: Date.now(),
				createdAt: stackHolder
			};

			promises.some(function(p) {
				if(p.promise === parent) {
					rec.parent = p;
					return true;
				}
			});

			promises.push(rec);
		}

		function promiseFulfilled(promise) {
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

			promises.some(function(rec) {
				if(promise === rec.promise) {
					rec.reason = reason;
					rec.rejectedAt = stackHolder;
					return true;
				}
			});

			report();
		}

		function promiseObserved(promise) {
			removeFromList(promises, promise);
		}

		function report() {
			return reporter(promises);
		}

		function reset() {
			promises = [];
		}

		function publish(target) {
			target.reportUnhandled = report;
			target.resetUnhandled = reset;
			target.promiseObserved = promiseObserved;
			target.promisePending = promisePending;
			target.promiseFulfilled = promiseFulfilled;
			target.unhandledRejection = unhandledRejection;
			return target;
		}
	};

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
