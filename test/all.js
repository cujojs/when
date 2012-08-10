(function(buster, when) {

var assert, fail, resolved, rejected;

assert = buster.assert;
fail = buster.assertions.fail;

resolved = when.resolve;
rejected = when.reject;

buster.testCase('when.all', {

	'should resolve empty input': function(done) {
		return when.all([],
			function(result) {
				assert.equals(result, []);
			},
			fail
		).always(done);
	},

	'should resolve values array': function(done) {
		var input = [1, 2, 3];
		when.all(input,
			function(results) {
				assert.equals(results, input);
			},
			fail
		).always(done);
	},

	'should resolve promises array': function(done) {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.all(input,
			function(results) {
				assert.equals(results, [1, 2, 3]);
			},
			fail
		).always(done);
	},

	'should resolve sparse array input': function(done) {
		var input = [, 1, , 1, 1 ];
		when.all(input,
			function(results) {
				assert.equals(results, input);
			},
			fail
		).always(done);
	},

	'should reject if any input promise rejects': function(done) {
		var input = [resolved(1), rejected(2), resolved(3)];
		when.all(input,
			fail,
			function(failed) {
				assert.equals(failed, 2);
			}
		).always(done);
	},

	'should throw if called with something other than a valid input plus callbacks': function() {
		assert.exception(function() {
			when.all(1, 2, 3);
		});
	},

	'should accept a promise for an array': function(done) {
		var expected, input;

		expected = [1, 2, 3];
		input = resolved(expected);

		when.all(input,
			function(results) {
				assert.equals(results, expected);
			},
			fail
		).always(done);
	},

	'should resolve to empty array when input promise does not resolve to array': function(done) {
		when.all(resolved(1),
			function(result) {
				assert.equals(result, []);
			},
			fail
		).always(done);
	}
});

})(
	this.buster || require('buster'),
	this.when   || require('..')
);
