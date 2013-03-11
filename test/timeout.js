(function(buster, when, timeout) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

function FakePromise() {
	this.then = function() {
		return this;
	};
}

sentinel = {};

buster.testCase('when/timeout', {
	'should reject after timeout': function(done) {
		timeout(new FakePromise(), 10).then(
			fail,
			function(e) {
				assert(e instanceof Error);
			}
		).ensure(done);
	},

	'should not timeout when rejected before timeout': function(done) {
		timeout(when.reject(sentinel), 10).then(
			fail,
			function(val) {
				assert.same(val, sentinel);
			}
		).ensure(done);
	},

	'should not timeout when forcibly resolved before timeout': function(done) {
		timeout(when.resolve(sentinel), 10).then(
			function(val) {
				assert.same(val, sentinel);
			},
			fail
		).ensure(done);
	},

	'should propagate progress': function(done) {
		var d = when.defer();

		timeout(d.promise, 10).then(null, null,
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
	this.when_timeout || require('../timeout')
);
