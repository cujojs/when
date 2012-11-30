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

	/**
	* Has the same behavior that {@link apply} has, with the difference that the
	* arguments to the function are provided individually, while {@link apply} accepts
	* a single array.
	*
	* @example
	*	function sumSmallNumbers(x, y) {
	*		var result = x + y;
	*		if(result < 10) {
	*			return result;
	*		} else {
	*			throw new Error("Calculation failed");
	*		}
	*	}
	*
	* // Logs '5'
	* func.apply(sumSmallNumbers, 2, 3).then(console.log, console.error);
	*
	* // Logs 'Calculation failed'
	* func.apply(sumSmallNumbers, 5, 10).then(console.log, console.error);
	*
	* @param {function} func function to be called
	* @param {...*} [args] arguments that will be forwarded to the function
	* @returns {Promise} promise for the return value of func
	*/

	function call(func /*, args... */) {
		return apply(func, slice.call(arguments, 1));
	}

	/**
	* Takes a 'regular' function and returns a version of that function that
	* returns a promise instead of a plain value, and handles thrown errors by
	* returning a rejected promise. Also accepts a list of arguments to be
	* prepended to the new function, as does Function.prototype.bind.
	*
	* @example
	*	function mayThrowError(n) {
	*		if(n % 2 === 1) { // Normally this wouldn't be so deterministic :)
	*			throw new Error("I don't like odd numbers");
	*		} else {
	*			return n;
	*		}
	*	}
	*
	*	var bound = fn.bind(mayThrowError);
	*
	*	// Logs "I don't like odd numbers"
	*	bound(1).then(console.log, console.error);
	*
	*	// Logs '6'
	*	bound(6).then(console.log, console.error);
	*
	* @example
	*	function sumTwoNumbers(x, y) {
	*		return x + y;
	*	}
	*
	*	var sumWithFive = fn.bind(sumTwoNumbers, 5);
	*
	*	// Logs '15'
	*	sumWithFive(10).then(console.log, console.error);
	*
	*	@param {Function} func function to be bound
	*	@param {...*} [args] arguments to be prepended for the new function
	*	@returns {Function} a promise-returning function
	*/

	function bind(func /*, args... */) {
		var args = slice.call(arguments, 1);
		return function() {
			return apply(func, args.concat(slice.call(arguments)));
		};
	}

	/**
	* Composes multiple functions by piping their return values. It is
	* transparent to whether the functions return 'regular' values or promises:
	* the piped argument is always a resolved value. If one of the functions
	* throws or returns a rejected promise, the composed promise will be also
	* rejected.
	*
	* The arguments given to the returned function (if any), are passed directly
	* to the first function on the 'pipeline'.
	*
	* @example
	*	function getHowMuchWeWillDestroy(parameter) {
	*		// Makes some calculations to find out which items the modification the user
	*		// wants will destroy. Returns a number
	*	}
	*
	*	function getUserConfirmation(itemsCount) {
	*		// Return a resolved promise if the user confirms the destruction,
	*		// and rejects it otherwise
	*	}
	*
	*	function saveModifications() {
	*		// Makes ajax to save modifications on the server, returning a
	*		// promise.
	*	}
	*
	*	function showNotification() {
	*		// Notifies that the modification was successful
	*	}
	*
	*	// Composes the whole process into one function that returns a promise
	*	var wholeProcess = func.compose(getHowMuchWeWillDestroy,
	*                                   getUserConfirmation,
	*                                   saveModifications,
	*                                   showNotification);
	*
	*	// Which is equivalent to
	*	var wholeProcess = function(parameter) {
	*		return fn.call(getHowMuchWeWillDestroy, parameter)
	*			.then(getUserConfirmation)
	*			.then(saveModifications)
	*			.then(showNotification);
	*	}
	*
	*
	* @param {Function} f the function to which the arguments will be passed
	* @param {...Function} [funcs] functions that will be composed, in order
	* @returns {Function} a promise-returning composition of the functions
	*/
	function compose(f /*, funcs... */) {
		var funcs = slice.call(arguments, 1);

		return function() {
			var args = slice.call(arguments);
			var firstPromise = apply(f, args);

			return when.reduce(funcs, function(arg, func) {
				return func(arg);
			}, firstPromise);
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


