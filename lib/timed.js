/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function timed(setTimer, cancelTimer, Promise) {
		/**
		 * Return a new promise that fulfills with the same
		 * @param ms
		 * @returns {Object.constructor}
		 */
		Promise.prototype.delay = function(ms) {
			var self = this;

			return new this.constructor(function(resolve, reject, notify) {
				self.then(function(x) {
					setTimer(function() {
						resolve(x);
					}, ms);
				}, reject, notify);
			});
		};

		/**
		 * Return a new promise that rejects after ms milliseconds unless
		 * this promise fulfills earlier, in which case the returned promise
		 * fulfills with the same value.
		 * @param {number} ms milliseconds
		 * @returns {Promise}
		 */
		Promise.prototype.timeout = function(ms) {
			var self = this;
			return new this.constructor(function(resolve, reject, notify) {

				var timer = setTimer(function onTimeout() {
					reject(new Error('timed out after ' + ms + 'ms'));
				}, ms);

				self.then(
					function onFulfill(x) {
						cancelTimer(timer);
						resolve(x);
					},
					function onReject(x) {
						cancelTimer(timer);
						reject(x);
					},
					notify
				);
			});
		};

		return Promise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
