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

	return function algebraic(Promise) {
		var promiseOf = Promise.of;
		var resolve = Promise.resolve;
		var reject = Promise.reject;

		/**
		 * Transform the fulfillment value of this promise, and return
		 * a new promise for the transformed result.
		 * @param {function} f function to use to transform
		 * @returns {Promise}
		 */
		Promise.prototype.map = function(f) {
			return this.flatMap(function(x) {
				return promiseOf(f(x));
			});
		};

		Promise.prototype.flatMap = function(f) {
			return this.then(function(x) {
				return f(x).then(identity);
			});
		};

		Promise.prototype.ap = function(promise) {
			return this.flatMap(function(f) {
				return promise.map(f);
			});
		};

		Promise.prototype.concat = function(promise) {
			var self = this;
			return new this.constructor(function(resolve, reject) {
				var rejections = [];
				self.then(resolve, handleReject);
				promise.then(resolve, handleReject);

				function handleReject(e) {
					if(rejections.length < 2) {
						rejections.push(e);
					} else {
						reject(rejections);
					}
				}
			});
		};

		Promise.prototype.filter = function(predicate) {
			return this.map(function(x) {
				return predicate(x) ? x : reject(new Error());
			});
		};

		Promise.prototype.reduce = function(f) {
			return arguments.length === 1 ? this.foldl1(f) : this.foldl(f, arguments[1]);
		};

		Promise.prototype.reduceRight = function(f) {
			return arguments.length < 2 ? this.foldr1(f) : this.foldr(f, arguments[1]);
		};

		Promise.prototype.foldl = Promise.prototype.foldr = function(f, initial) {
			return this.map(function(x) {
				return f(initial, x);
			});
		};

		Promise.prototype.foldl1 = Promise.prototype.foldr1 = function(f) {
			/*jshint unused:false*/
			return resolve(this);
		};

		return Promise;
	};

	function identity(x) {
		return x;
	}


});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
