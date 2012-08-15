/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * parallel.js
 *
 * Run a set of task functions in parallel
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(['./when'], function(when) {

	/**
	 * Run array of tasks in parallel
	 * @param tasks {Array} array of task functions
	 * @param [args] {*} arguments to be passed to all tasks
	 * @return {Promise} promise for array containing the
	 * result of each task in the array position corresponding
	 * to position of the task in the tasks array
	 */
	return function parallel(tasks /*, args... */) {
		var args = Array.prototype.slice.call(arguments, 1);
		return when.map(tasks, function(task) {
			return task.call(null, args);
		});
	};

});
})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
	? (module.exports = factory(require('./when')))
	: (this.when_parallel = factory(this.when));
}
	// Boilerplate for AMD, Node, and browser global
);


