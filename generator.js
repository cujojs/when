/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define(function(require) {

	var when, slice;

	when = require('./when');
	slice = Array.prototype.slice;

	return {
		apply: apply,
		call: call,
		lift: lift
	};

	/**
	 * Lift a generator to create a function that can suspend and
	 * resume using the `yield` keyword to await promises.
	 * @param {function} generator
	 * @return {function}
	 */
	function lift(generator) {
		return function() {
			return apply(generator, arguments);
		};
	}

	/**
	 * Immediately call a generator as a promise-aware coroutine
	 * that can suspend and resume using the `yield` keyword to
	 * await promises.  Additional arguments after the first will
	 * be passed through to the generator.
	 * @param {function} generator
	 * @returns {Promise} promise for the ultimate value returned
	 *  from the generator.
	 */
	function call(generator /*x, y, z...*/) {
		return apply(generator, slice.call(arguments, 1));
	}

	/**
	 * Immediately apply a generator, with the supplied args array,
	 * as a promise-aware coroutine that can suspend and resume
	 * using the `yield` keyword to await promises.
	 * @param {function} generator
	 * @returns {Promise} promise for the ultimate value returned
	 *  from the generator.
	 */
	function apply(generator, args) {
		/*jshint validthis:true*/
		var iterator = generator.apply(this, args);

		return next();

		function next(x) {
			return step('next', x);
		}

		function fail(e) {
			return step('throw', e);
		}

		function step(action, x) {
			var result;

			try {
				result = iterator[action](x);
			} catch (e) {
				return when.reject(e);
			}

			return result.done ? result.value : when(result.value, next, fail);
		}
	}
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
