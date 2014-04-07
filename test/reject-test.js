var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when = require('../when');

buster.testCase('when.reject', {

	'should reject an immediate value': function(done) {
		var expected = 123;

		when.reject(expected).then(
			fail,
			function(value) {
				assert.equals(value, expected);
			}
		).ensure(done);
	},

	'should reject a resolved promise': function(done) {
		var expected, d;

		expected = 123;
		d = when.defer();
		d.resolve(expected);

		when.reject(d.promise).then(
			fail,
			function(value) {
				assert.same(value, d.promise);
			}
		).ensure(done);
	},

	'should reject a rejected promise': function(done) {
		var expected, d;

		expected = 123;
		d = when.defer();
		d.reject(expected);

		when.reject(d.promise).then(
			fail,
			function(value) {
				assert.equals(value, d.promise);
			}
		).ensure(done);
	}
});
