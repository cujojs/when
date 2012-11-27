/**
 * task
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(function(require) {

	var when = require('./when');

	return {
		unfold: unfold,
		generate: generate,
		run: run
	};

	function unfold(generate, proceed, transform, seed) {
		return when(seed, function(seed) {

			return when(generate(seed), unfoldNext);

			function unfoldNext(next) {
				if(proceed(next, seed)) {
					try {
						return when(transform(next, seed), function(newSeed) {
							return unfold(generate, proceed, transform, newSeed);
						});
					} catch(e) {
						return when.reject(e);
					}
				} else {
					return when.resolve(seed);
				}
			}
		});
	}

	function generate(generator, proceed, seed) {
		var results = [];
		return unfold(
			generator,
			proceed,
			function(newSeed, value) { results.push(value); return newSeed; },
			seed
		).then(function() {
			return results;
		});
	}

	function run(getNextTask, proceed, initialArgs) {
		return unfold(
			getNextTask,
			function(task, args) { return !!task && proceed(task, args); },
			function(task, args) { return task(args); },
			initialArgs
		);
	}

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
