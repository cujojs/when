/** @license MIT License (c) copyright 2010-2013 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
(function(define) { 'use strict';
define(function(require) {

	var mapKeys = require('./keys').map;

	return {
		all: all,
		map: map
	};

	/**
	 * Resolve all the values in the supplied tree structure
	 * @param {Promise|object} tree or promise for tree whose values will be resolved
	 * @returns {Promise} promise for a tree with fulfilled values
	 */
	function all(object) {
		return map(object, identity)
	}

	/**
	 * Map values in the supplied tree structure
	 * @returns {Promise} promise for a tree with mapped, fulfilled values
	 */
	function map(tree, f) {
		return mapKeys(tree, function(v) {
			if(v != null && typeof v === 'object') {
				// map subtree
				return map(v, f);
			}

			// map leaf value
			return f(v);
		});
	}

	function identity(x) { return x; }

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
