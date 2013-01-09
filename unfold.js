/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * unfold
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(['when'], function(when) {

	/**
	 * Anamorphic unfold/map that generates values by applying
	 * seed = transform(generator(seed)) iteratively until proceed(seed)
	 * returns false.
	 * @param {function} generator function that generates a value given a seed,
	 *  may return a promise.
	 * @param {function} proceed given a seed, must return truthy if the unfold
	 *  should continue, or falsey if it should terminate
	 * @param {function} transform function that transforms the result of
	 *  generate(seed) to produce a new seed to use in the next iteration
	 * @param seed {*|Promise} any value or promise
	 * @return {Promise} the result of the unfold
	 */
	return function unfold(generator, proceed, transform, seed) {
		return when(seed, function(seed) {

			return proceed(seed) ? when(generator(seed), unfoldNext) : seed;

			function unfoldNext(next) {
				try {
					return when(transform(next, seed), function(newSeed) {
						return unfold(generator, proceed, transform, newSeed);
					});
				} catch(e) {
					return when.reject(e);
				}
			}
		});
	};

});
})(typeof define == 'function' && define.amd
	? define
	: function (deps, factory) { typeof exports == 'object'
		? (module.exports = factory(require('./when')))
		: (this.when_unfold = factory(this.when));
	}
	// Boilerplate for AMD, Node, and browser global
);

