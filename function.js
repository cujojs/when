/** @license MIT License (c) copyright 2013-2014 original author or authors */

/**
 * Collection of helper functions for wrapping and executing 'traditional'
 * synchronous functions in a promise interface.
 *
 * @author Brian Cavalier
 * @contributor Renato Zannon
 */

(function(define) {
define(function(require) {

	var when, slice;

	when = require('./when');
	slice = [].slice;

	return {
		apply: apply,
		call: when['try'],
		lift: lift,
		compose: compose
	};

	/**
	 * Takes a function and an optional array of arguments (that might be promises),
	 * and calls the function. The return value is a promise whose resolution
	 * depends on the value returned by the function.
	 *
	 * @example
	 *    function onlySmallNumbers(n) {
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
	function apply(func, promisedArgs) {
		return arguments.length > 1
			? when.try.apply(this, [func].concat(promisedArgs))
			: when.try.call(this, func);
	}

	/**
	 * Takes a 'regular' function and returns a version of that function that
	 * returns a promise instead of a plain value, and handles thrown errors by
	 * returning a rejected promise. Also accepts a list of arguments to be
	 * prepended to the new function, as does Function.prototype.bind.
	 *
	 * The resulting function is promise-aware, in the sense that it accepts
	 * promise arguments, and waits for their resolution.
	 *
	 * @example
	 *    function mayThrowError(n) {
	 *		if(n % 2 === 1) { // Normally this wouldn't be so deterministic :)
	 *			throw new Error("I don't like odd numbers");
	 *		} else {
	 *			return n;
	 *		}
	 *	}
	 *
	 *    var lifted = fn.lift(mayThrowError);
	 *
	 *    // Logs "I don't like odd numbers"
	 *    lifted(1).then(console.log, console.error);
	 *
	 *    // Logs '6'
	 *    lifted(6).then(console.log, console.error);
	 *
	 * @example
	 *    function sumTwoNumbers(x, y) {
	 *		return x + y;
	 *	}
	 *
	 *    var sumWithFive = fn.lifted(sumTwoNumbers, 5);
	 *
	 *    // Logs '15'
	 *    sumWithFive(10).then(console.log, console.error);
	 *
	 *    @param {Function} func function to be bound
	 *    @param {...*} [args] arguments to be prepended for the new function
	 *    @returns {Function} a promise-returning function
	 */
	function lift(func /*, args... */) {
		var args = slice.call(arguments, 1);
		return function() {
			args.unshift(func);
			args.push.apply(args, slice.call(arguments));
			return when.try.apply(this, args);
		};
	}

	/**
	 * Composes multiple functions by piping their return values. It is
	 * transparent to whether the functions return 'regular' values or promises:
	 * the piped argument is always a resolved value. If one of the functions
	 * throws or returns a rejected promise, the composed promise will be also
	 * rejected.
	 *
	 * The arguments (or promises to arguments) given to the returned function (if
	 * any), are passed directly to the first function on the 'pipeline'.
	 *
	 * @example
	 *    function getHowMuchWeWillDestroy(parameter) {
	 *		// Makes some calculations to find out which items the modification the user
	 *		// wants will destroy. Returns a number
	 *	}
	 *
	 *    function getUserConfirmation(itemsCount) {
	 *		// Return a resolved promise if the user confirms the destruction,
	 *		// and rejects it otherwise
	 *	}
	 *
	 *    function saveModifications() {
	 *		// Makes ajax to save modifications on the server, returning a
	 *		// promise.
	 *	}
	 *
	 *    function showNotification() {
	 *		// Notifies that the modification was successful
	 *	}
	 *
	 *    // Composes the whole process into one function that returns a promise
	 *    var wholeProcess = func.compose(getHowMuchWeWillDestroy,
	 *                                   getUserConfirmation,
	 *                                   saveModifications,
	 *                                   showNotification);
	 *
	 *    // Which is equivalent to
	 *    var wholeProcess = function(parameter) {
	 *		return fn.call(getHowMuchWeWillDestroy, parameter)
	 *			.then(getUserConfirmation)
	 *			.then(saveModifications)
	 *			.then(showNotification);
	 *	}
	 *
	 * @param {Function} f the function to which the arguments will be passed
	 * @param {...Function} [funcs] functions that will be composed, in order
	 * @returns {Function} a promise-returning composition of the functions
	 */
	function compose(f /*, funcs... */) {
		var funcs = slice.call(arguments, 1);

		return function() {
			var thisArg, args, firstPromise;

			thisArg = this;
			args = slice.call(arguments);
			firstPromise = when.try.apply(thisArg, [f].concat(args));

			return when.reduce(funcs, function(arg, func) {
				return func.call(thisArg, arg);
			}, firstPromise);
		};
	}
});

})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);


