(function(buster, define) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

function createTask(y) {
	return function(x) {
		return x + y;
	};
}

define('when/pipeline-test', function (require) {

	var when, pipeline;

	when = require('when');
	pipeline = require('when/pipeline');

	buster.testCase('when/pipeline', {

		'should execute tasks in order': function() {
			return pipeline([createTask('b'), createTask('c'), createTask('d')], 'a').then(
				function(result) {
					assert.equals(result, 'abcd');
				}
			);
		},

		'should resolve to initial args when no tasks supplied': function() {
			return pipeline([], 'a', 'b').then(
				function(result) {
					assert.equals(result, ['a', 'b']);
				}
			);
		},

		'should resolve to empty array when no tasks and no args supplied': function() {
			return pipeline([]).then(
				function(result) {
					assert.equals(result, []);
				}
			);
		},

		'should pass args to initial task': function() {
			var expected, tasks;

			expected = [1, 2, 3];
			tasks = [this.spy()];

			return pipeline.apply(null, [tasks].concat(expected)).then(
				function() {
					assert.calledOnceWith.apply(assert, tasks.concat(expected));
				}
			);
		},

		'should allow initial args to be promises': function() {
			var expected, tasks;

			expected = [1, 2, 3];
			tasks = [this.spy()];

			return pipeline.apply(null, [tasks].concat([when(1), when(2), when(3)])).then(
				function() {
					assert.calledOnceWith.apply(assert, tasks.concat(expected));
				}
			);
		}

	});

});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-\.]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
