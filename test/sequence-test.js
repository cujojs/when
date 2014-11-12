var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var when = require('../when');
var sequence = require('../sequence');

var sentinel = { value: 'sentinel' };

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

buster.testCase('when/sequence', {

	'should execute tasks in order': function() {
		return sequence([createTask(1), createTask(2), createTask(3)]).then(
			function(result) {
				assert.equals(result, [1, 2, 3]);
			}
		);
	},

	'should resolve to empty array when no tasks supplied': function() {
		return sequence([], 1, 2, 3).then(
			function(result) {
				assert.equals(result, []);
			}
		);
	},

	'should pass args to all tasks': function(done) {
		var expected, tasks;

		expected = [1, 2, 3];
		tasks = [expectArgs(expected), expectArgs(expected), expectArgs(expected)];

		return sequence.apply(null, [tasks].concat(expected)).ensure(done);
	},

	'should accept promises for args': function(done) {
		var expected, tasks;

		expected = [1, 2, 3];
		tasks = [expectArgs(expected), expectArgs(expected), expectArgs(expected)];

		expected = [when(1), when(2), when(3)];
		return sequence.apply(null, [tasks].concat(expected)).ensure(done);
	},

	'should reject if task throws': function() {
		return sequence([function () {
			return 1;
		}, function () {
			throw sentinel;
		}])['catch'](function (e) {
			assert.same(e, sentinel);
		});
	}
});
