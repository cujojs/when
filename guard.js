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

		function wait() {
			var d = when.defer();

			if(condition.enter()) {
				d.resolve();
			} else {
				waiting.push(d.resolver);
			}

			return d.promise;
		}

		function notify() {
			condition.exit();
			if(waiting.length) {
				waiting.shift().resolve();
			}
		}
	}

	function one() {
		return n(1);
	}

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
