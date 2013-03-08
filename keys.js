/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function(define) { 'use strict';
define(['./when'], function(when) {
	var keys, eachKey, owns;

	// Public API

	keys = {
		all: all,
		map: map,
		reduce: reduce
	};

	owns = {}.hasOwnProperty;

	eachKey = Object.keys
		? function(object, lambda) {
		Object.keys(object).forEach(function(key) {
			lambda(object[key], key);
		});
	}
		: function(object, lambda) {
		for(var key in object) {
			if(owns.call(object, key)) {
				lambda(object[key], key);
			}
		}
	};

	return keys;

	function all(object) {
		return map(object, identity);
	}

	function map(object, mapFunc) {
		return when(object, function(object) {
			var results, d, toResolve;

			results = {};
			d = when.defer();
			toResolve = 0;

			eachKey(object, function(value, key) {
				++toResolve;
				when(value, mapFunc).then(function(mapped) {
					results[key] = mapped;

					if(!--toResolve) {
						d.resolve(results);
					}
				}, d.reject, d.notify);
			});

			return d.promise;
		});
	}

	function reduce(object, reduceFunc, initialValue) {
		return when(object, function(object) {
			var result;

			result = initialValue;

			eachKey(object, function(value, key) {
				result = when(result, function(c) {
					return when(value, function(value) {
						return reduceFunc(c, value, key);
					});
				});
			});

			return result;
		});
	}

	function identity(x) { return x; }

});
})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
		? (module.exports = factory(require('./when')))
		: (this.when_keys = factory(this.when));
	}
		// Boilerplate for AMD, Node, and browser global
);
