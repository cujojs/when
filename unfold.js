/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * unfold
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(function(require) {

	var Promise = require('./Promise');

	/**
	 * Anamorphic unfold/map that generates values by applying
	 * handler(generator(seed)) iteratively until condition(seed)
	 * returns true.
	 * @param {function} unspool function that generates a [value, newSeed]
	 *  given a seed.
	 * @param {function} condition function that, given the current seed, returns
	 *  truthy when the unfold should stop
	 * @param {function} handler function to handle the value produced by generator
	 * @param seed {*|Promise} any value or promise
	 * @return {Promise} the result of the unfold
	 */
	return function unfold(unspool, condition, handler, seed) {
		return Promise.unfold(unspool, condition, handler, seed);
	};

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); } );

