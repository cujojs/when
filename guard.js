/**
 * guard
 * @author: brian@briancavalier.com
 */
(function(define) {
define(function(require) {

	var when, slice, undef;

	when = require('./when');
	slice = [].slice;

	guard.one = one;
	guard.n = n;

	return guard;

	/**
	 * Creates a guarded version of f that can only be entered when the supplied
	 * condition allows.
	 * @param {object} condition represents a critical section that may only
	 *  be entered simultaneously by a certain number of executions
	 * @param {function} condition.enter function that must return true if an
	 *  invocation of f is allowed, or false if it must be forced to wait,
	 *  i.e. determines when an invocation of f is allowed to enter the
	 *  critical section
	 * @param {function} condition.exit function to be called when an invocation
	 *  of f has returned, i.e. it has exited the critical section
	 * @param {function} f function to guard
	 * @returns {Function} guarded f
	 */
	function guard(condition, f) {

		return function() {
			var args = slice.call(arguments);

			// TODO: Need better always/finally
			return when(condition.enter(), function() {
				return f.apply(undef, args);
			}).then(
				function(value) { condition.exit(); return value; },
				function(reason) { condition.exit(); throw reason; }
			);
		};
	}

	/**
	 * Condition that allows only one execution in a critical section
	 * @returns {{enter: Function, exit: Function}} condition with enter/exit methods
	 */
	function one() {
		return n(1);
	}

	/**
	 * Condition that allows n simultaneous executions in a critical section
	 * @param {number} n number allowed
	 * @returns {{enter: Function, exit: Function}}
	 */
	function n(n) {
		var count, waiting;

		count = 0;
		waiting = [];

		return {
			enter: function() {
				var d = when.defer();

				count += 1;
				if(count <= n) {
					d.resolve();
				} else {
					waiting.push(d.resolver);
				}

				return d.promise;
			},
			exit: function() {
				count = Math.max(count-1, 0);

				if(waiting.length) {
					waiting.shift().resolve();
				}
			}
		}
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
