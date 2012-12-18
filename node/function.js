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
	*	var node_fn = require("when/node/function");
	*
	*	// Logs '15'
	*	node_fn.apply(onlySmallNumbers, [5]).then(console.log, console.error);
	*
	*	// Logs 'Calculation failed'
	*	node_fn.apply(onlySmallNumbers, [15]).then(console.log, console.error);
	*
	* @example
	*	var fs = require("fs"), node_fn = require("when/node/function");
	*
	*	// Uses node's native fs.readFile to read file with the given name,
	*	// and returns a promise for the result.
	*	function promiseRead(filename) {
	*		return node_fn.apply(fs.readFile, [filename, "utf-8"]);
	*	}
	*
	*	// The promise is resolved with the contents of the file if everything
	*	// goes ok
	*	promiseRead('exists.txt').then(console.log, console.error);
	*
	*	// And will be rejected if something doesn't work out (the file not
	*	// existing, for instance)
	*	promiseRead('doesnt_exist.txt').then(console.log, console.error);
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

	function call(func /*, args... */) {
		return apply(func, slice.call(arguments, 1));
	}

	function bind(func /*, args... */) {
		var args = slice.call(arguments, 1);
		return function() {
			return apply(func, args.concat(slice.call(arguments)));
		};
	}

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


