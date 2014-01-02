/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * unfold
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(function(require) {

	var ArrayPromise = require('../ArrayPromise');

	/**
	 * Given a seed and generator, produces an Array.  Effectively the
	 * dual (opposite) of when.reduce()
	 * @param {function} generator function that generates a value (or promise
	 *  for a value) to be placed in the resulting array
	 * @param {function} condition given a seed, must return truthy if the unfold
	 *  should continue, or falsey if it should terminate
	 * @param {*|Promise} seed any value or promise
	 * @return {Promise} resulting array
	 */
	return function list(generator, condition, seed) {
		return ArrayPromise.unfold(generator, condition, seed);
	};

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);

