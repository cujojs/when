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

	var promises, aggregator;

	if(console) {
		promises = [];

		console.promises = {
			report: report,
			reset: reset,
			get: function() { return promises; }
		};

		console.promisePending = function(promise) {
			var stackHolder;
			try {
				throw new Error();
			} catch(e) {
				stackHolder = e;
			}

			promises.push({ promise: promise, timestamp: +(new Date()), createdAt: stackHolder });
		}

		console.promiseResolved = function(promise) {
			removeFromList(promises, promise);
			report();
		}

		console.unhandledRejection = function(promise, reason) {
			var stackHolder;
			try {
				throw new Error();
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

		console.handledRejection = function(promise) {
			removeFromList(promises, promise);
		}

		reset();

		if (typeof process !== "undefined" && process.on) {
			process.on("exit", report);
		}
	}

	aggregator = {
		reset: reset,
		report: report
	}

	return aggregator;

	function report() {
		aggregator.reporter && aggregator.reporter(promises);
	}

	function reset() {
		promises = [];
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
