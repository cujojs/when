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

		function PromiseStatus(parent) {
			if(!(this instanceof PromiseStatus)) {
				return new PromiseStatus(parent);
			}

			var stackHolder;

			try {
				throw new Error();
			} catch(e) {
				stackHolder = e;
			}

			this.key = nextKey++;
			promises[this.key] = this;

			this.parent = parent;
			this.timestamp = +(new Date());
			this.createdAt = stackHolder;
		}

		PromiseStatus.prototype = {
			observed: function () {
				if(this.key in promises) {
					delete promises[this.key];
					report();
				}

				return new PromiseStatus(this);
			},
			fulfilled: function () {
				if(this.key in promises) {
					delete promises[this.key];
					report();
				}
			},
			rejected: function (reason) {
				var stackHolder;

				if(this.key in promises) {
					try {
						throw new Error(reason && reason.message || reason);
					} catch (e) {
						stackHolder = e;
					}

					this.reason = reason;
					this.rejectedAt = stackHolder;
					report();

				}
			}
		};

		PromiseStatus.reportUnhandled = report;
		PromiseStatus.resetUnhandled = reset;

		reset();

		return PromiseStatus;

		function report() {
			return reporter(promises);
		}

		function reset() {
			nextKey = 0;
			promises = {}; // Should be WeakMap
		}
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
