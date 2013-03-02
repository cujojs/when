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

		var waiting = [];

		return function() {
			var args = slice.call(arguments);

			// TODO: Need better always/finally
			return when(wait(), function() {
				return f.apply(undef, args);
			}).then(
				function(value) { notify(); return value; },
				function(reason) { notify(); throw reason; }
			);
		};

		/**
		 * Wait for condition to allow entry into the critical section
		 * @returns {Promise} promise that will fulfill when the critical
		 *  section may be entered
		 */
		function wait() {
			var d = when.defer();

			if(condition.enter()) {
				d.resolve();
			} else {
				waiting.push(d.resolver);
			}

			return d.promise;
		}

		/**
		 * Once the critical section is exited, notify the next waiting
		 * execution
		 */
		function notify() {
			condition.exit();
			if(waiting.length) {
				waiting.shift().resolve();
			}
		}
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
		var count = 0;

		return {
			enter: function() {
				count += 1;
				return count <= n;
			},
			exit: function() {
				count = Math.max(count-1, 0);
			}
		}
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
