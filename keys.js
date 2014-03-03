/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function(define) { 'use strict';
define(function(require) {

	var when = require('./when');
	var toPromise = when.resolve;

	return {
		all: when.lift(all),
		map: map
	};

	/**
	 * Resolve all the key-value pairs in the supplied object or promise
	 * for an object.
	 * @param {Promise|object} object or promise for object whose key-value pairs
	 *  will be resolved
	 * @returns {Promise} promise for an object with the fully resolved key-value pairs
	 */
	function all(object) {
		return when.promise(function(resolve, reject, notify) {
			var results = {};
			var pending = 0;

			eachPair(object, function(x, k) {
				++pending;
				toPromise(x).then(function(x) {
					results[k] = x;

					if(!--pending) {
						resolve(results);
					}
				}, reject, notify);
			});

			if(pending === 0) {
				resolve(results);
			}
		});
	}

	/**
	 * Map values in the supplied object's keys
	 * @param {Promise|object} object or promise for object whose key-value pairs
	 *  will be reduced
	 * @param {function} f mapping function mapFunc(value) which may
	 *  return either a promise or a value
	 * @returns {Promise} promise for an object with the mapped and fully
	 *  resolved key-value pairs
	 */
	function map(object, f) {
		return toPromise(object).then(function(object) {
			return all(Object.keys(object).reduce(function(o, k) {
				o[k] = toPromise(object[k]).then(f);
				return o;
			}, {}));
		});
	}

	function eachPair(object, f) {
		Object.keys(object).forEach(function(k) {
			f(object[k], k);
		});
	}

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
