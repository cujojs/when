(function(buster, when) {

var assert, fail, resolved, rejected;

assert = buster.assert;
fail = buster.assertions.fail;

resolved = when.resolve;
rejected = when.reject;

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

	'should resolve empty input': function(done) {
		when.some([], 1,
			function(result) {
				assert.equals(result, []);
			},
			fail
		).ensure(done);
	},

	'should resolve values array': function(done) {
		var input = [1, 2, 3];
		when.some(input, 2,
			function(results) {
				assert(isSubset(results, input));
			},
			fail
		).ensure(done);
	},

	'should resolve promises array': function(done) {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.some(input, 2,
			function(results) {
				assert(isSubset(results, [1, 2, 3]));
			},
			fail
		).ensure(done);
	},

	'should resolve sparse array input': function(done) {
		var input = [, 1, , 2, 3 ];
		when.some(input, 2,
			function(results) {
				assert(isSubset(results, input));
				done();
			},
			fail
		).ensure(done);
	},

	'should reject with all rejected input values if resolving howMany becomes impossible': function(done) {
		var input = [resolved(1), rejected(2), rejected(3)];
		when.some(input, 2,
			fail,
			function(failed) {
				assert.equals(failed, [2, 3]);
			}
		).ensure(done);
	},

	'should throw if called with something other than a valid input, count, and callbacks': function() {
		assert.exception(function() {
			when.some(1, 2, 3, 2);
		});
	},

	'should accept a promise for an array': function(done) {
		var expected, input;

		expected = [1, 2, 3];
		input = resolved(expected);

		when.some(input, 2,
			function(results) {
				assert.equals(results.length, 2);
			},
			fail
		).ensure(done);
	},

	'should resolve to empty array when input promise does not resolve to array': function(done) {
		when.some(resolved(1), 1,
			function(result) {
				assert.equals(result, []);
			},
			fail
		).ensure(done);
	}


});
})(
	this.buster || require('buster'),
	this.when   || require('..')
);
