var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when = require('../when');

function contains(array, value) {
	for(var i = array.length-1; i >= 0; i--) {
		if(array[i] === value) {
			return true;
		}
	}

	return false;
}

function isSubset(subset, superset) {
	var i, subsetLen;

	subsetLen = subset.length;

	if (subsetLen > superset.length) {
		return false;
	}

	for(i = 0; i<subsetLen; i++) {
		if(!contains(superset, subset[i])) {
			return false;
		}
	}

	return true;
}

buster.testCase('when.some', {

	'should reject with RangeError': {
		'when n > number of inputs': {
			'for base case of zero inputs': function() {
				return when.some([], 1)['catch'](
					function (e) {
						assert(e instanceof RangeError);
					});
			},

			'for m inputs requesting n > m winners': function() {
				var input = [1,,2];
				return when.some(input, input.length+1)['catch'](
					function (e) {
						assert(e instanceof RangeError);
					});
			}
		},

		'when input promise does not resolve to array': function() {
			return when.some(when.resolve(1), 1)['catch'](
				function(e) {
					assert(e instanceof RangeError);
				});
		}
	},

	'should reject with all rejected input values if resolving howMany becomes impossible': function() {
		var input = [when.resolve(1), when.reject(2), when.reject(3)];
		return when.some(input, 2).then(
			fail,
			function(failed) {
				assert.equals(failed, [2, 3]);
			});
	},

	'should resolve values array': function() {
		var input = [1, 2, 3];
		return when.some(input, 2).then(
			function(results) {
				assert(isSubset(results, input));
			});
	},

	'should resolve promises array': function() {
		var input = [when.resolve(1), when.resolve(2), when.resolve(3)];
		return when.some(input, 2).then(
			function(results) {
				assert(isSubset(results, [1, 2, 3]));
			});
	},

	'should resolve sparse array input': function() {
		var input = [, 1, , 2, 3 ];
		return when.some(input, 2).then(
			function(results) {
				assert(isSubset(results, input));
			});
	},

	'should accept a promise for an array': function() {
		var expected, input;

		expected = [1, 2, 3];
		input = when.resolve(expected);

		return when.some(input, 2).then(
			function(results) {
				assert.equals(results.length, 2);
			});
	},

	'should resolve to empty array when n is zero': function() {
		return when.some([1,2,3], 0).then(function(result) {
			assert.equals(result, []);
		});
	}
});
