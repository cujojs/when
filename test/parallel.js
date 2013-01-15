(function(buster, parallel) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

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
				assert(result.indexOf(1) >= 0);
				assert(result.indexOf(2) >= 0);
				assert(result.indexOf(3) >= 0);
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

		return parallel.apply(null, [tasks].concat(expected)).always(done);
	}
});

})(
	this.buster || require('buster'),
	this.when_parallel || require('../parallel')
);
