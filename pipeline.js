/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * pipeline.js
 *
 * Run a set of task functions in sequence, passing the result
 * of the previous as an argument to the next.  Like a shell
 * pipeline, e.g. `cat file.txt | grep 'foo' | sed -e 's/foo/bar/g'
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(['./when'], function(when) {

	/**
	 * Run array of tasks in a pipeline where the next
	 * tasks receives the result of the previous.  The first task
	 * will receive the initialArgs as its argument list.
	 * @param tasks {Array} array of task functions
	 * @param [initialArgs...] {*} arguments to be passed to the first task
	 * @return {Promise} promise for return value of the final task
	 */
	return function pipeline(tasks /* initialArgs... */) {
		var initialArgs = Array.prototype.slice.call(arguments, 1);
		return when.reduce(tasks,
			function(args, task) {
				return [task.apply(null, args)];
			}, initialArgs)
		.then(
			function(result) {
				return result[0];
			}
		);
	};

});
})(typeof define == 'function' && define.amd
	? define
	: function (deps, factory) { typeof exports == 'object'
	? (module.exports = factory(require('./when')))
	: (this.when_pipeline = factory(this.when));
}
	// Boilerplate for AMD, Node, and browser global
);


