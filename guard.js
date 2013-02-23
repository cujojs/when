/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * guard.js
 *
 * Wait until the guard condition is true before proceeding
 * with deferred execution.
 *
 * @author sakari@rocketpack.fi
 */

(function(define) {
define(['./when', './function'], function(when, func) {

	function Guard(condition) {
		if (condition.enter) {
			this._condition = condition;
		} else {
			var users = 0;
			this._condition = {
				enter: function() {
					if(users < condition) {
						users++;
						return true;
					}
					return false;
				},
				exit: function() {
					users--;
				}
			};
		}
		this._pending = [];
	}
	Guard.prototype._trigger = function() {
		var self = this;
		if(this._pending.length === 0 || !this._condition.enter()) {
			return;
		}
		var next = this._pending.shift();
		func.apply(next.fn, next.args)
			.then(function() {
				next.dfd.resolve.apply(next.dfd, Array.prototype.slice.apply(arguments));
			}, function() {
				next.dfd.reject.apply(next.dfd, Array.prototype.slice.apply(arguments));
			})
			.always(function() {
				self._condition.exit();
				self._trigger();
			});
	};

	Guard.prototype.do = function(fn) {
		var self = this;
		return function() {
			var dfd = when.defer();
			self._pending.push({dfd: dfd, fn: fn, args: Array.prototype.slice.apply(arguments)});
			self._trigger();
			return dfd;
		};
	};

	/**
	 * Wait until condition before proceeding
	 * @param condition
	 * @return {Guard} guard object with `do` method
	 *
	 * The `do` method takes a function which should return a deferred.
	 * The argument functions are called when the guard condition is true.
	 */
	return function guard(condition) {
		return new Guard(condition);
	};

});
})(typeof define == 'function' && define.amd
	? define
	: function (deps, factory) { typeof exports == 'object'
        ? (module.exports = factory(require('./when'), require('./function')))
        : (this.when_guard = factory(this.when, this.when_function));
	}
	// Boilerplate for AMD, Node, and browser global
);


