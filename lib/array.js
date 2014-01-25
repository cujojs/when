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

	var bind, uncurryThis, call, forEach, mapArray, reduce, reduceRight, slice;

	bind = Function.prototype.bind;
	uncurryThis = bind.bind(bind.call);
	call = uncurryThis(bind.call);
	slice = uncurryThis(Array.prototype.slice);
	forEach = uncurryThis(Array.prototype.forEach);
	mapArray = uncurryThis(Array.prototype.map);
	reduce = uncurryThis(Array.prototype.reduce);
	reduceRight = uncurryThis(Array.prototype.reduceRight);

	return function array(Promise) {

		var cast = Promise.cast;
		var all = Promise.all;

		// Additional array combinators

		Promise.any = any;
		Promise.some = some;
		Promise.settle = settle;

		Promise.map = map;
		Promise.foldl = foldl;
		Promise.foldl1 = foldl1;
		Promise.foldr = foldr;
		Promise.foldr1 = foldr1;

		/**
		 * When this promise fulfills with an array, do
		 * onFulfilled.apply(void 0, array)
		 * @param (function) onFulfilled function to apply
		 * @returns {Promise} promise for the result of applying onFulfilled
		 */
		Promise.prototype.spread = function(onFulfilled) {
			return this.then(all).then(function(array) {
				return onFulfilled.apply(void 0, array);
			});
		};

		return Promise;

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
		 * Apply f to the value of each promise in a list of promises
		 * and return a new list containing the results.
		 * @param {array} promises
		 * @param {function} f
		 * @param {function} fallback
		 * @returns {Promise}
		 */
		function map(promises, f, fallback) {
			return all(mapArray(promises, function(x) {
				return cast(x).then(f, fallback);
			}));
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

		function foldl(promises, f, initial) {
			return reduce(promises, function(result, x, i) {
				return cast(result).then(function(r) {
					return cast(x).then(function(x) {
						return f(r, x, i);
					});
				});
			}, cast(initial));
		}

		function foldl1(promises, f) {
			return reduce(promises, function(result, x, i) {
				return cast(result).then(function(r) {
					return cast(x).then(function(x) {
						return f(r, x, i);
					});
				});
			});
		}

		function foldr(promises, f, initial) {
			return reduceRight(promises, function(result, x, i) {
				return cast(result).then(function(r) {
					return cast(x).then(function(x) {
						return f(r, x, i);
					});
				});
			}, cast(initial));
		}

		function foldr1(promises, f) {
			return reduceRight(promises, function(result, x, i) {
				return cast(result).then(function(r) {
					return cast(x).then(function(x) {
						return f(r, x, i);
					});
				});
			});
		}
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
