(function(buster, when) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

buster.testCase('when.resolve', {

	'should resolve an immediate value': function(done) {
		var expected = 123;

		when.resolve(expected).then(
			function(value) {
				assert.equals(value, expected);
			},
			fail
		).always(done);
	},

	'should resolve a resolved promise': function(done) {
		var expected, d;

		expected = 123;
		d = when.defer();
		d.resolve(expected);

		when.resolve(d.promise).then(
			function(value) {
				assert.equals(value, expected);
			},
			fail
		).always(done);
	},

	'should reject a rejected promise': function(done) {
		var expected, d;

		expected = 123;
		d = when.defer();
		d.reject(expected);

		when.resolve(d.promise).then(
			fail,
			function(value) {
				assert.equals(value, expected);
			}
		).always(done);
	}

});

})(
	this.buster || require('buster'),
	this.when || require('../when')
);
