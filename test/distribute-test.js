var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var when = require('../when');
var distribute = require('../distribute');

buster.testCase('when/distribute', {

	'should execute tasks in order': function() {

        function task1(seed) {
            return seed + 1;
        }

        function task2(res1) {
            return res1 + 2;
        }

        function task3(res1, res2) {
            return res1 + res2 + 3;
        }

        function task4(res1, res2, res3) {
            return res1 + res2 + res3 + 4;
        }

		return distribute([task1, task2, task3, task4], 0).then(
			function(result) {
				assert.equals(result, [1, 3, 7, 15]);
			}
		);
	},

	'should resolve to initial args when no tasks supplied': function() {
		return distribute([], 'a', 'b').then(
			function(result) {
				assert.equals(result, ['a', 'b']);
			}
		);
	},

	'should resolve to empty array when no tasks and no args supplied': function() {
		return distribute([]).then(
			function(result) {
				assert.equals(result, []);
			}
		);
	},

	'should pass args to initial task': function() {
		var expected, tasks;

		expected = [1, 2, 3];
		tasks = [this.spy()];

		return distribute.apply(null, [tasks].concat(expected)).then(
			function() {
				assert.calledOnceWith.apply(assert, tasks.concat(expected));
			}
		);
	},

	'should allow initial args to be promises': function() {
		var expected, tasks;

		expected = [1, 2, 3];
		tasks = [this.spy()];

		return distribute.apply(null, [tasks].concat([when(1), when(2), when(3)])).then(
			function() {
				assert.calledOnceWith.apply(assert, tasks.concat(expected));
			}
		);
	}
});
