var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var when = require('../when');
var pipeline = require('../pipeline');

function createTask(y) {
	return function(x) {
		return x + y;
	};
}

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
