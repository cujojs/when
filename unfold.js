/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * unfold
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(function(require) {

	var when = require('./when');

	unfold.list = list;
	unfold.tasks = tasks;

	return unfold;

	function unfold(generate, proceed, transform, seed) {
		return when(seed, function(seed) {

			return proceed(seed) ? when(generate(seed), unfoldNext) : seed;

			function unfoldNext(next) {
				try {
					return when(transform(next, seed), function(newSeed) {
						return unfold(generate, proceed, transform, newSeed);
					});
				} catch(e) {
					return when.reject(e);
				}
			}
		});
	}

	function list(generator, proceed, seed) {
		var list = [];

		return unfold(generator, proceed, append, seed).yield(list);

		function append(newSeed, value) {
			list.push(value);
			return newSeed;
		}
	}

	function tasks(getNextTask, proceed, initialArgs) {
		return unfold(getNextTask, proceed, apply, initialArgs);
	}

	function apply(f, args) {
		return f(args);
	}

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
