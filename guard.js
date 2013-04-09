/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * General concurrency guard
 * Adapted from original concept by Sakari Jokinen (Rocket Pack, Ltd.)
 *
 * @author Brian Cavalier
 * @contributor Sakari Jokinen
 */
(function(define) {
define(function(require) {

	var when, slice;

	when = require('./when');
	slice = [].slice;

	guard.one = one;
	guard.n = n;

	return guard;

	/**
	 * Creates a guarded version of f that can only be entered when the supplied
	 * condition allows.
	 * @param {function} condition represents a critical section that may only
	 *  be entered simultaneously by a certain number of executions
	 * @param {function} f function to guard
	 * @returns {function} guarded f
	 */
	function guard(condition, f) {
		return function() {
			var self = this, args = arguments;

			return when(condition(), function(notify) {
				return when(f.apply(self, args)).ensure(notify);
			});
		};
	}

	/**
	 * Condition that allows only one execution in a critical section
	 * @returns {function} condition function that allows at most 1 execution
	 *  in the critical section
	 */
	function one() {
		return n(1);
	}

	/**
	 * Condition that allows n simultaneous executions in a critical section
	 * @param {number} allowed number allowed
	 * @returns {function}
	 */
	function n(allowed) {
		var count, waiting;

		count = 0;
		waiting = [];

		return function() {
			return when.promise(function(resolve) {
				if(++count <= allowed) {
					resolve(notify);
				} else {
					waiting.push(resolve);
				}

				function notify() {
					count = Math.max(count-1, 0);

					if(waiting.length) {
						waiting.shift()(notify);
					}
				}
			});
		};
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
