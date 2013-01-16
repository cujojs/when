(function(buster, list) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

function noop() {}

buster.testCase('when/unfold/list', {

	'should produce an empty list when proceed returns false immediately': function(done) {
		var spy;

		spy = this.stub().returns(false);

		list(noop, spy, sentinel).then(
			function(value) {
				assert.equals(value, []);
			}
		).always(done);
	},

	'should produce a list of N elements': function(done) {
		var len, i;

		len = i = 3;

		function proceed() {
			return i--;
		}

		function generate() {
			return i;
		}

		list(generate, proceed, 3).then(
			function(result) {
				assert.equals(result.length, len);
				assert.equals(result, [3, 2, 1]);
			}
		).always(done);
	}

});
})(
	this.buster || require('buster'),
	this.when_unfoldList || require('../../unfold/list')
);
