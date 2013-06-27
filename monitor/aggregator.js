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
		var promises, nextKey;

		nextKey = 0;

		function Monitor(key) {
			this.key = key;
		}

		Monitor.prototype = {
			observed: function () {
				delete promises[this.key];
			},
			fulfilled: function () {
				delete promises[this.key];
				report();
			},
			rejected: function (reason) {
				var stackHolder, rec;

				rec = promises[this.key];

				if (rec) {
					try {
						throw new Error(reason && reason.message || reason);
					} catch (e) {
						stackHolder = e;
					}

					rec.reason = reason;
					rec.rejectedAt = stackHolder;

					report();
				}
			}
		};

		reset();

		return publish({ publish: publish });

		function publish(target) {
			target.monitorPromise = monitorPromise;
			target.reportUnhandled = report;
			target.resetUnhandled = reset;
			return target;
		}

		function monitorPromise(parentKey) {
			var stackHolder, key;

			try {
				throw new Error();
			} catch(e) {
				stackHolder = e;
			}

			key = nextKey++;

			promises[key] = {
				key: key,
				timestamp: +(new Date()),
				createdAt: stackHolder,
				parent: promises[parentKey]
			};

			return new Monitor(key);
		}

		function report() {
			return reporter(promises);
		}

		function reset() {
			promises = {};
		}
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
