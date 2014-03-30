/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function timed(setTimer, cancelTimer, Promise) {
		/**
		 * Return a new promise whose fulfillment value is revealed only
		 * after ms milliseconds
		 * @param {number} ms milliseconds
		 * @returns {Promise}
		 */
		Promise.prototype.delay = function(ms) {
			var p = this._beget();

			this._handler.when(noop, noop, void 0, p._handler,
				function delay(x) {
					var h = this; // this = p._handler
					setTimer(function() { h.resolve(x); }, ms);
				},
				p._handler.reject, p._handler.notify);

			return p;
		};

		/**
		 * Return a new promise that rejects after ms milliseconds unless
		 * this promise fulfills earlier, in which case the returned promise
		 * fulfills with the same value.
		 * @param {number} ms milliseconds
		 * @param {Error|*=} reason optional rejection reason to use, defaults
		 *   to an Error if not provided
		 * @returns {Promise}
		 */
		Promise.prototype.timeout = function(ms, reason) {
			var hasReason = arguments.length > 1;
			var p = this._beget();

			var timer = setTimer(onTimeout, ms);

			this._handler.when(noop, noop, void 0, p._handler,
				function onFulfill(x) {
					cancelTimer(timer);
					this.resolve(x); // this = p._handler
				},
				function onReject(x) {
					cancelTimer(timer);
					this.reject(x); // this = p._handler
				},
				p._handler.notify);

			return p;

			function onTimeout() {
				p._handler.reject(hasReason
					? reason : new Error('timed out after ' + ms + 'ms'));
			}
		};

		return Promise;

	};

	function noop() {}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
