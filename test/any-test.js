var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var refute = buster.refute;
var fail = buster.referee.fail;

var when = require('../when');
var resolved = when.resolve;
var rejected = when.reject;

function contains(array, item) {
	for(var i=array.length - 1; i >= 0; --i) {
		if(array[i] === item) {
			return true;
		}
	}

	return false;
}

buster.testCase('when.any', {

	'should reject with RangeError': {
		'when zero inputs': function() {
			return when.any([])['catch'](
				function (e) {
					assert(e instanceof RangeError);
				});
		},

		'when input promise does not resolve to array': function() {
			return when.any(when.resolve(1))['catch'](
				function(e) {
					assert(e instanceof RangeError);
				});
		}
	},

	'should reject with all rejected input values if all inputs are rejected': function() {
		var input = [rejected(1), rejected(2), rejected(3)];
		return when.any(input)['catch'](
			function(result) {
				assert.equals(result, [1, 2, 3]);
			}
		);
	},

	'should resolve with an input value': function() {
		var input = [1, 2, 3];
		return when.any(input).then(
			function(result) {
				assert(contains(input, result));
			},
			fail
		);
	},

	'should resolve with a promised input value': function() {
		var input = [resolved(1), resolved(2), resolved(3)];
		return when.any(input).then(
			function(result) {
				assert(contains([1, 2, 3], result));
			}
		);
	},

	'should accept a promise for an array': function() {
		var expected, input;

		expected = [1, 2, 3];
		input = resolved(expected);

		return when.any(input).then(
			function(result) {
				refute.equals(expected.indexOf(result), -1);
			}
		);
	}

});
