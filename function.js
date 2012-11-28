/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(['./when'], function(when) {

	var slice;

	slice = Array.prototype.slice;

	return {
		apply: apply,
		call: call,
		bind: bind,
		compose: compose,
		promisify: promisify
	};

	/**
	* Takes a function and an optional array of arguments, and calls the function
	* immediately. The return value is a promise whose resolution depends on the
	* value returned by the function.
	*
	* @example
	*	function onlySmallNumbers(n) {
	*		if(n < 10) {
	*			return n + 10;
	*		} else {
	*			throw new Error("Calculation failed");
	*		}
	*	}
	*
	* // Logs '15'
	* func.apply(onlySmallNumbers, [5]).then(console.log, console.error);
	*
	* // Logs 'Calculation failed'
	* func.apply(onlySmallNumbers, [15]).then(console.log, console.error);
	*
	* @param {function} func function to be called
	* @param {Array} [args] array of arguments to func
	* @returns {Promise} promise for the return value of func
	*/

	function apply(func, args) {
		var d = when.defer();

		try {
			d.resolve(func.apply(null, args));
		} catch(e) {
			d.reject(e);
		}

		return d.promise;
	}

	function call(func /*, args... */) {
		return apply(func, slice.call(arguments, 1));
	}

	function bind(func /*, args... */) {
		var args = slice.call(arguments, 1);
		return function() {
			return apply(func, args.concat(slice.call(arguments)));
		};
	}

	function compose(f /*g, ... */) {
		var funcs = slice.call(arguments, 1);

		return function() {
			var args = slice.call(arguments);

			return when.reduce(funcs, function(arg, func) {
				return func(arg);
			}, f.apply(null, args));
		};
	}

	function promisify(func, callbackPos, errbackPos, progbackPos) {
		var orig, initArgs;

		orig = func;

		// If you only supply the function, assume callback and errback
		// will always be the last two params.
		// If you supply positions, use them to inject callback/errback/progback
		// into the args.
		if(arguments.length === 1) {
			initArgs = function(args, deferred) {
				args.push(deferred.resolve);
				args.push(deferred.reject);

				return args;
			};
		} else {
			initArgs = function(args, deferred) {
				if(typeof callbackPos == 'number') {
					args.splice(callbackPos, 0, deferred.resolve);
				}

				if(typeof errbackPos == 'number') {
					args.splice(errbackPos, 0, deferred.reject);
				}

				if(typeof progbackPos == 'number') {
					args.splice(progbackPos, 0, deferred.progress);
				}

				return args;
			};
		}

		return function() {
			var args, d;

			args = slice.call(arguments);
			d = when.defer();

			apply(orig, initArgs(args, d));

			return d.promise;
		};
	}
});

})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
	? (module.exports = factory(require('./when'), require('./nextTick')))
	: (this.when_fn = factory(this.when, this.when_nextTick));
}
	// Boilerplate for AMD, Node, and browser global
);


