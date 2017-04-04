/** @license MIT License (c) copyright 2011-2014 original author or authors */

/**
 * distribute.js
 *
 * Run a set of task functions in sequence, but passing the result of the all
 * the previous tasks as an argument to the next task in a distributive fashion.
 */

(function(define) {
define(function(require) {

	var when = require('./when');
	var all = when.Promise.all;
	var slice = Array.prototype.slice;

	/**
	 * Run array of tasks in a pipeline where the next tasks
     * receives the result of all the previous ones.
     * The first task receives the initialArgs as its argument list.
	 * @param tasks {Array|Promise} array or promise for array of task functions
	 * @param [initialArgs...] {*} arguments to be passed to the first task
	 * @return {Promise} promise for return value of all tasks
	 */
	return function distribute(tasks /* initialArgs... */) {
		// Self-optimizing function to run first task with multiple
		// args using apply, but subsequent tasks via direct invocation
		var runTask = function(args, task) {
			runTask = function(arg, task) {
				return arg.concat(task.apply(task, arg));
			};

			return [task.apply(null, args)];
		};

		return all(slice.call(arguments, 1)).then(function(initialArgs) {
			return when.reduce(tasks, function(arg, task) {
				return runTask(arg, task);
			}, initialArgs);
		});
	};

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
