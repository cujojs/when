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

	return function foldable(Promise) {

		var resolve = Promise.resolve;

		Promise.prototype.reduce = function(f) {
			return arguments.length === 1 ? this.foldl1(f) : this.foldl(f, arguments[1]);
		};

		Promise.prototype.reduceRight = function(f) {
			return arguments.length < 2 ? this.foldr1(f) : this.foldr(f, arguments[1]);
		};

		Promise.prototype.foldr = function(f, initial) {
			return this.map(function(x) {
				return f(x, initial);
			});
		};

		Promise.prototype.foldl = function(f, initial) {
			return this.map(function(x) {
				return f(initial, x);
			});
		};

		Promise.prototype.foldl1 = Promise.prototype.foldr1 = function(f) {
			/*jshint unused:false*/
			// TODO: should this just return this?
			return resolve(this);
		};

		return Promise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
