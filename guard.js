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
	 * @param {function} condition represents a critical section that may only
	 *  be entered simultaneously by a certain number of executions
	 * @param {function} f function to guard
	 * @returns {function} guarded f
	 */
	function guard(condition, f) {

		return function() {
			var args = slice.call(arguments);

			return when(condition(), function(exit) {
				try {
					return when(f.apply(undef, args)).always(exit);
				} catch(e) {
					return exit();
				}
			});
		};
	}

	/**
	 * Condition that allows only one execution in a critical section
	 * @returns {function} condition with enter/exit methods
	 */
	function one() {
		return n(1);
	}

	/**
	 * Condition that allows n simultaneous executions in a critical section
	 * @param {number} n number allowed
	 * @returns {function}
	 */
	function n(n) {
		var count, waiting;

		count = 0;
		waiting = [];

		return function() {

			var enter, exit;

			enter = when.defer();
			exit = when.defer();

			count += 1;
			if(count <= n) {
				enter.resolve(exit.resolve);
			} else {
				waiting.push(enter.resolve.bind(enter, exit.resolve));
			}

			exit.promise.then(notify);

			return enter.promise;

			function notify() {
				count = Math.max(count-1, 0);

				if(waiting.length) {
					waiting.shift()();
				}
			}
		};

	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
