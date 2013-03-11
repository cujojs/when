(function(buster, when, delay) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

function now() {
	return (new Date()).getTime();
}

sentinel = {};

buster.testCase('when/delay', {
	'should resolve after delay': function(done) {
		delay(0).then(
			function() {
				assert(true);
			},
			fail
		).ensure(done);
	},

	'should resolve with provided value after delay': function(done) {
		delay(sentinel, 0).then(
			function(val) {
				assert.same(val, sentinel);
				done();
			},
			fail
		).ensure(done);
	},

	'should delay by the provided value': function(done) {
		var start = now();

		delay(100).then(
			function() {
				assert((now() - start) > 50);
			},
			fail
		).ensure(done);
	},

	'should resolve after input promise plus delay': function(done) {
		delay(when.resolve(sentinel), 10).then(
			function(val) {
				assert.equals(val, sentinel);
			},
			fail
		).ensure(done);
	},

	'should not delay if rejected': function(done) {
		var d = when.defer();
		d.reject(sentinel);

		delay(d.promise, 0).then(
			fail,
			function(val) {
				assert.equals(val, sentinel);
			}
		).ensure(done);
	},

	'should propagate progress': function(done) {
		var d = when.defer();

		delay(d.promise, 0).then(null, null,
			function(val) {
				assert.same(val, sentinel);
				d.resolve();
			}
		).ensure(done);

		d.notify(sentinel);
	}
});
})(
	this.buster || require('buster'),
	this.when || require('..'),
	this.when_delay || require('../delay')
);
