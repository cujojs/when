var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var list = require('../../unfold/list');

var sentinel = {};

function noop() {}

buster.testCase('when/unfold/list', {

	'should produce an empty list when proceed returns truthy immediately': function(done) {
		function condition() {
			return true;
		}

		list(noop, condition, sentinel).then(
			function(value) {
				assert.equals(value, []);
			}
		).ensure(done);
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
		).ensure(done);
	}
});
