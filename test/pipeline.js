(function(buster, pipeline) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

function createTask(y) {
	return function(x) {
		return x + y;
	};
}

buster.testCase('when/pipeline', {

	'should execute tasks in order': function() {
		return pipeline([createTask('b'), createTask('c')], 'a').then(
			function(result) {
				assert.equals(result, 'abc');
			}
		);
	},

	'should resolve to initial zeroeth arg when no tasks supplied': function() {
		return pipeline([], 'a', 'b').then(
			function(result) {
				assert.equals(result, 'a');
			}
		);
	},

	'should resolve to undefined when no tasks and no args supplied': function() {
		return pipeline([]).then(
			function(result) {
				refute.defined(result);
			}
		);
	},

	'should pass args to initial task': function() {
		var expected, tasks;

		function verifyArgs() {
			assert.equals(Array.prototype.slice.call(arguments), expected);
		}

		expected = [1, 2, 3];
		tasks = [verifyArgs];

		return pipeline.apply(null, [tasks].concat(expected));
	}
});

})(
	this.buster || require('buster'),
	this.when_pipeline || require('../pipeline')
);
