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
	// TODO: Rename this module to PromiseStatus in 3.x

	return function createAggregator(reporter) {
		var promises, nextKey;

		function PromiseStatus(parent) {
			this.key = nextKey++;
			promises[this.key] = this;

			this.parent = parent;
			this.timestamp = +(new Date());
			this.createdAt = captureStack();
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

				if(this.key in promises) {
					this.reason = reason;
					this.rejectedAt = captureStack(reason && reason.message || reason);
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

	function captureStack(msg) {
		try {
			throw new Error(msg);
		} catch (e) {
			return e;
		}
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
