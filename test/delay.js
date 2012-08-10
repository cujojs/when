(function(buster, when, delay) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

function now() {
	return (new Date()).getTime();
}

buster.testCase('when/delay', {
	'should resolve after delay': function(done) {
		delay(0).then(
			function() {
				assert(true);
			},
			fail
		).always(done);
	},

	'should resolve with provided value after delay': function(done) {
		delay(1, 0).then(
			function(val) {
				assert.equals(val, 1);
				done();
			},
			fail
		).always(done);
	},

	'should delay by the provided value': function(done) {
		var start = now();

		delay(100).then(
			function() {
				assert((now() - start) > 50);
			},
			fail
		).always(done);
	},

	'should resolve after input promise plus delay': function(done) {
		delay(when.resolve(1), 10).then(
			function(val) {
				assert.equals(val, 1);
			},
			fail
		).always(done);
	},

	'should not delay if rejected': function(done) {
		var d = when.defer();
		d.reject(1);

		delay(d.promise, 0).then(
			fail,
			function(val) {
				assert.equals(val, 1);
			}
		).always(done);
	}
});
})(
	this.buster || require('buster'),
	this.when || require('..'),
	this.when_delay || require('../delay')
);
