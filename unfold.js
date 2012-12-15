/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * unfold
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(['when'], function(when) {

	var when = require('./when');

	unfold.list = list;
	unfold.tasks = tasks;

	return unfold;

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
	function unfold(generator, proceed, transform, seed) {
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
	}

	/**
	 * Given a seed and generator, produces an Array.  Effectively the
	 * dual (opposite) of when.reduce()
	 * @param {function} generator function that generates a value (or promise
	 *  for a value) to be placed in the resulting array
	 * @param {function} proceed given a seed, must return truthy if the unfold
	 *  should continue, or falsey if it should terminate
	 * @param {*|Promise} seed any value or promise
	 * @return {Promise} resulting array
	 */
	function list(generator, proceed, seed) {
		var list = [];

		return unfold(generator, proceed, append, seed).yield(list);

		function append(newSeed, value) {
			list.push(value);
			return newSeed;
		}
	}

	/**
	 * Executes a potentially unbounded list of tasks produced by
	 * getNextTask, until proceed returns falsey.  The first task
	 * receives args as its argument
	 * @param {function} getNextTask
	 * @param {function} proceed
	 * @param args
	 * @return {Promise}
	 */
	function tasks(getNextTask, proceed, args) {
		return unfold(getNextTask, proceed, apply, args);
	}

	function apply(f, arg) {
		return f(arg);
	}

});
})(typeof define == 'function' && define.amd
		? define
		: function (deps, factory) { typeof exports == 'object'
		? (module.exports = factory(require('./when')))
		: (this.when_unfold = factory(this.when));
	}
	// Boilerplate for AMD, Node, and browser global
);

