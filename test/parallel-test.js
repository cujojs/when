var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var when = require('../when');
var parallel = require('../parallel');

function createTask(y) {
	return function() {
		return y;
	};
}

function expectArgs(expected) {
	return function() {
		var args = Array.prototype.slice.call(arguments);
		assert.equals(args, expected);
	};
}

buster.testCase('when/parallel', {

	'should execute all tasks': function() {
		return parallel([createTask(1), createTask(2), createTask(3)]).then(
			function(result) {
				assert.equals(result, [1, 2, 3]);
			}
		);
	},

	'should resolve to empty array when no tasks supplied': function() {
		return parallel([], 1, 2, 3).then(
			function(result) {
				assert.equals(result, []);
			}
		);
	},

	'should pass args to all tasks': function(done) {
		var expected, tasks;

		expected = [1, 2, 3];
		tasks = [expectArgs(expected), expectArgs(expected), expectArgs(expected)];

		parallel.apply(void 0, [tasks].concat(expected)).ensure(done);
	},

	'should accept promises for args': function(done) {
		var expected, tasks;

		expected = [1, 2, 3];
		tasks = [expectArgs(expected), expectArgs(expected), expectArgs(expected)];

		parallel.apply(void 0, [tasks].concat(expected.map(when))).ensure(done);
	}
});
