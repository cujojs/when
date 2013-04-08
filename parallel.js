/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * parallel.js
 *
 * Run a set of task functions in parallel.  All tasks will
 * receive the same args
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(function(require) {

	var when;

	when = require('./when');

	/**
	 * Run array of tasks in parallel
	 * @param tasks {Array|Promise} array or promiseForArray of task functions
	 * @param [args] {*} arguments to be passed to all tasks
	 * @return {Promise} promise for array containing the
	 * result of each task in the array position corresponding
	 * to position of the task in the tasks array
	 */
	return function parallel(tasks /*, args... */) {
		var args = Array.prototype.slice.call(arguments, 1);
		return when.map(tasks, function(task) {
			return task.apply(null, args);
		});
	};

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);


