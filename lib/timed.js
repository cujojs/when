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
			return this.then(function(x) {
				var p = Promise._defer();

				setTimer(function() {
					p._handler.resolve(x);
				}, ms);

				return p;
			});
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

			var timer = setTimer(function onTimeout() {
				p._handler.reject(hasReason
					? reason : new Error('timed out after ' + ms + 'ms'));
			}, ms);

			this.then(
				function onFulfill(x) {
					cancelTimer(timer);
					p._handler.resolve(x);
				},
				function onReject(x) {
					cancelTimer(timer);
					p._handler.reject(x);
				},
				function(x) {
					p._handler.notify(x);
				}
			);

			return p;
		};

		return Promise;

	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
