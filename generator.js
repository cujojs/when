/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var when = require('./when');
	var slice = Array.prototype.slice;

	/**
	 * Lift a generator to create a function that can suspend and
	 * resume using the `yield` keyword to await promises.
	 * @param {function} generator
	 * @return {function}
	 */
	function lift(generator) {
		return function() {
			return run(generator, this, arguments);
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
		/*jshint validthis:true*/
		return run(generator, this, slice.call(arguments, 1));
	}

	/**
	 * Immediately apply a generator, with the supplied args array,
	 * as a promise-aware coroutine that can suspend and resume
	 * using the `yield` keyword to await promises.
	 * @param {function} generator
	 * @param {Array} args arguments with which to initialize the generator
	 * @returns {Promise} promise for the ultimate value returned
	 *  from the generator.
	 */
	function apply(generator, args) {
		/*jshint validthis:true*/
		return run(generator, this, args || []);
	}

	/**
	 * Helper to initiate the provided generator as a coroutine
	 * @returns {*}
	 */
	function run(generator, thisArg, args) {
		var stepper = new Stepper(next, error, generator.apply(thisArg, args));

		return stepper.step('next', void 0);

		function next(x) { return stepper.step('next', x); }
		function error(e) { return stepper.step('throw', e); }
	}

	/**
	 * Manages the process of stepping the provided iterator
	 * @constructor
	 */
	function Stepper(next, error, iterator) {
		this.next = next;
		this.error = error;
		this.iterator = iterator;
	}

	Stepper.prototype.step = function(action, x) {
		try {
			return this._continue(action, x);
		} catch (e) {
			return when.reject(e);
		}
	};

	Stepper.prototype._continue = function(action, x) {
		var result = this.iterator[action](x);
		return result.done ? result.value : when(result.value, this.next, this.error);
	};

	return {
		lift: lift,
		call: call,
		apply: apply
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
