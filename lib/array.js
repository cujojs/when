/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) { 'use strict';
define(function() {

	var bind, uncurryThis, call, forEach, slice;

	bind = Function.prototype.bind;
	uncurryThis = bind.bind(bind.call);
	call = uncurryThis(bind.call);
	slice = uncurryThis(Array.prototype.slice);
	forEach = uncurryThis(Array.prototype.forEach);

	return function array(Promise) {
		// Static array combinators

		var cast = Promise.cast;

		Promise.all = all;
		Promise.any = any;
		Promise.some = some;
		Promise.race = race;
		Promise.settle = settle;

		/**
		 * When this promise fulfills with an array, do
		 * onFulfilled.apply(void 0, array)
		 * @param (function) onFulfilled function to apply
		 * @returns {Promise} promise for the result of applying onFulfilled
		 */
		Promise.prototype.spread = function(onFulfilled) {
			return this.then(function(array) {
				return all(array).then(function(array) {
					return onFulfilled.apply(void 0, array);
				});
			});
		};

		return Promise;

		/**
		 * Return a promise that will fulfill when all promises in the
		 * input array have fulfilled, or will reject when one of the
		 * promises rejects.
		 * @param {array} promises array of promises
		 * @returns {Promise} promise for array of fulfillment values
		 */
		function all(promises) {
			return new Promise(function(resolve, reject, notify) {
				var pending = 0;
				var results = [];

				forEach(promises, function(x, i) {
					++pending;
					cast(x).then(function(x) {
						results[i] = x;

						if(--pending === 0) {
							resolve(results);
						}
					}, reject, notify);
				});

				if(pending === 0) {
					resolve(results);
				}
			});
		}

		/**
		 * One-winner competitive race.
		 * Return a promise that will fulfill when one of the promises
		 * in the input array fulfills, or will reject when all promises
		 * have rejected.
		 * @param {array} promises
		 * @returns {Promise} promise for the first fulfilled value
		 */
		function any(promises) {
			return new Promise(function(resolve, reject) {
				var pending = 0;
				var errors = [];

				forEach(promises, function(p) {
					++pending;
					cast(p).then(resolve, handleReject);
				});

				if(pending === 0) {
					resolve();
				}

				function handleReject(e) {
					errors.push(e);
					if(--pending === 0) {
						reject(errors);
					}
				}
			});
		}

		/**
		 * N-winner competitive race
		 * Return a promise that will fulfill when n input promises have
		 * fulfilled, or will reject when it becomes impossible for n
		 * input promises to fulfill (ie when promises.length - n + 1
		 * have rejected)
		 * @param {array} promises
		 * @param {number} n
		 * @returns {Promise} promise for the earliest n fulfillment values
		 */
		function some(promises, n) {
			return new Promise(function(resolve, reject, notify) {
				var pending = 0;
				var results = [];
				var errors = [];

				forEach(promises, function(p) {
					++pending;
					cast(p).then(handleResolve, handleReject, notify);
				});

				if(pending === 0) {
					resolve(results);
				}

				n = Math.min(n, pending);

				function handleResolve(x) {
					--pending;
					results.push(x);
					if(results.length === n) {
						resolve(slice(results));
					}
				}

				function handleReject(e) {
					errors.push(e);
					if(--pending < n) {
						reject(errors);
					}
				}
			});
		}

		/**
		 * Fulfill-reject competitive race
		 * Return a promise that will settle to the same state as the
		 * earliest input promise to settle.
		 * @param {array} promises
		 * @returns {Promise}
		 */
		function race(promises) {
			return new Promise(function(resolve, reject) {
				forEach(promises, function(p) {
					cast(p).then(resolve, reject);
				});
			});
		}

		/**
		 * Return a promise that will always fulfill with an array containing
		 * the outcome states of all input promises.  The returned promise
		 * will never reject.
		 * @param {array} promises
		 * @returns {Promise}
		 */
		function settle(promises) {
			return all(promises.map(function(p) {
				p = cast(p);
				return p.then(inspect, inspect);

				function inspect() {
					return p.inspect();
				}
			}));
		}
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
