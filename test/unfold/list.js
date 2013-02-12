(function(buster, list) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

function noop() {}

buster.testCase('when/unfold/list', {

	'should produce an empty list when proceed returns truthy immediately': function(done) {
		var spy;

		spy = this.stub().returns(true);

		list(noop, spy, sentinel).then(
			function(value) {
				assert.equals(value, []);
			}
		).always(done);
	},

	'should produce a list of N elements': function(done) {
		var len = 3;

		function condition(i) {
			return i == len;
		}

		function generate(x) {
			return [x, x+1];
		}

		list(generate, condition, 0).then(
			function(result) {
				assert.equals(result.length, len);
				assert.equals(result, [0, 1, 2]);
			}
		).always(done);
	}

});
})(
	this.buster || require('buster'),
	this.when_unfoldList || require('../../unfold/list')
);
