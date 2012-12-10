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

	function apply(func, context, args) {
		var d = when.defer();

		args = args || [];
		args.push(createCallback(d));

		try {
			func.apply(context, args);
		} catch(e) {
			d.reject(e);
		}

		return d.promise;
	}

	function call(func, context /*, args... */) {
		return apply(func, context, slice.call(arguments, 1));
	}

	function bind(func, context /*, args... */) {
		var args = slice.call(arguments, 1);
		return function() {
			return apply(func, context, args.concat(slice.call(arguments)));
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


