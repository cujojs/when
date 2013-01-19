/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(['../when'], function(when) {

	var slice;

	slice = Array.prototype.slice;

	return {
		apply: apply,
		call: call,
		bind: bind,
		createCallback: createCallback
	};

	/**
	* Takes a node-style async function and calls it immediately (with an optional
	* array of arguments). It returns a promise whose resolution depends on whether
	* the async functions calls its callback with the conventional error argument
	* or not.
	*
	* With this it becomes possible to leverage existing APIs while still reaping
	* the benefits of promises.
	*
	* @example
	*	function onlySmallNumbers(n, callback) {
	*		if(n < 10) {
	*			callback(null, n + 10);
	*		} else {
	*			callback(new Error("Calculation failed"));
	*		}
	*	}
	*
	*	var nodefn = require("when/node/function");
	*
	*	// Logs '15'
	*	nodefn.apply(onlySmallNumbers, [5]).then(console.log, console.error);
	*
	*	// Logs 'Calculation failed'
	*	nodefn.apply(onlySmallNumbers, [15]).then(console.log, console.error);
	*
	* @param {function} func node-style function that will be called
	* @param {Array} [args] array of arguments to func
	* @returns {Promise} promise for the value func passes to its callback
	*
	*/
	function apply(func, args) {
		var d = when.defer();

		args = args || [];
		args.push(createCallback(d));

		try {
			func.apply(null, args);
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
	*	function sumSmallNumbers(x, y, callback) {
	*		var result = x + y;
	*		if(result < 10) {
	*			callback(null, result);
	*		} else {
	*			callback(new Error("Calculation failed"));
	*		}
	*	}
	*
	*	// Logs '5'
	*	nodefn.call(sumSmallNumbers, 2, 3).then(console.log, console.error);
	*
	*	// Logs 'Calculation failed'
	*	nodefn.call(sumSmallNumbers, 5, 10).then(console.log, console.error);
	*
	* @param {function} func node-style function that will be called
	* @param {...*} [args] arguments that will be forwarded to the function
	* @returns {Promise} promise for the value func passes to its callback
	*/
	function call(func /*, args... */) {
		return apply(func, slice.call(arguments, 1));
	}

	/**
	* Takes a node-style function and returns new function that wraps the
	* original and, instead of taking a callback, returns a promise.
	*
	* Upon execution, the orginal function is executed as well. If it passes
	* a truthy value as the first argument to the callback, it will be
	* interpreted as an error condition, and the promise will be rejected
	* with it. Otherwise, the call is considered a resolution, and the promise
	* is resolved with the callback's second argument.
	*
	* @example
	*	var fs = require("fs"), nodefn = require("when/node/function");
	*
	*	var promiseRead = nodefn.bind(fs.readFile);
	*
	*	// The promise is resolved with the contents of the file if everything
	*	// goes ok
	*	promiseRead('exists.txt').then(console.log, console.error);
	*
	*	// And will be rejected if something doesn't work out
	*	// (e.g. the files does not exist)
	*	promiseRead('doesnt_exist.txt').then(console.log, console.error);
	*
	*
	* @param {Function} func node-style function to be bound
	* @param {...*} [args] arguments to be prepended for the new function
	* @returns {Function} a promise-returning function
	*/
	function bind(func /*, args... */) {
		var args = slice.call(arguments, 1);
		return function() {
			return apply(func, args.concat(slice.call(arguments)));
		};
	}

	/**
	 * Takes an object that responds to the resolver interface, and returns
	 * a function that will resolve or reject it depending on how it is called.
	 *
	 * @example
	 *	function callbackTakingFunction(callback) {
	 *		if(somethingWrongHappened) {
	 *			callback(error);
	 *		} else {
	 *			callback(null, interestingValue);
	 *		}
	 *	}
	 *
	 *	var when = require('when'), nodefn = require('when/node/function');
	 *
	 *	var deferred = when.defer();
	 *	callbackTakingFunction(nodefn.createCallback(deferred.resolver));
	 *
	 *	deferred.then(function(interestingValue) {
	 *		// Use interestingValue
	 *	});
	 *
	 * @param {Resolver} resolver that will be 'attached' to the callback
	 * @returns {Function} a node-style callback function
	 **/
	function createCallback(resolver) {
		return function(err, value) {
			if(err) {
				resolver.reject(err);
			} else if(arguments.length > 2) {
				resolver.resolve(slice.call(arguments, 1));
			} else {
				resolver.resolve(value);
			}
		};
	}
});

})(typeof define == 'function'
	? define
	: function (deps, factory) { module.exports = factory(require('../when')); }
	// Boilerplate for AMD and Node
);


