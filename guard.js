/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * Generalized promise concurrency guard
 * Adapted from original concept by Sakari Jokinen (Rocket Pack, Ltd.)
 *
 * @author Brian Cavalier
 * @author John Hann
 * @contributor Sakari Jokinen
 */
(function(define) {
define(function(require) {

	var when = require('./when');
	var slice = Array.prototype.slice;

	guard.n = n;

	return guard;

	/**
	 * Creates a guarded version of f that can only be entered when the supplied
	 * condition allows.
	 * @param {function} condition represents a critical section that may only
	 *  be entered when allowed by the condition
	 * @param {function} f function to guard
	 * @returns {function} guarded version of f
	 */
	function guard(condition, f) {
		return function() {
			var args = slice.call(arguments);

			return when(condition.enter()).withThis(this).then(function () {
				return when(f.apply(this, args));
			}).tap(condition.resolved, condition.rejected).tap(condition.exit);
		};
	}

	/**
	 * Creates a condition that allows only n simultaneous executions
	 * of a guarded function
	 * @param {number} allowed number of allowed simultaneous executions
	 * @returns {function} condition function which returns a promise that
	 *  fulfills when the critical section may be entered.  The fulfillment
	 *  value is a function ("notifyExit") that must be called when the critical
	 *  section has been exited.
	 */
	function n(allowed) {
		var count = 0;
		var waiting = [];
		return {
			enter: function () {
				return when.promise(function(resolve) {
					if(count < allowed) {
						resolve();
					} else {
						waiting.push(resolve);
					}
					count += 1;
				});
			},
			resolved: function () {
			},
			rejected: function () {
			},
			exit: function () {
				count = Math.max(count - 1, 0);
				if(waiting.length > 0) {
					waiting.shift()();
				}
			}
		};
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
