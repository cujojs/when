(function(buster, when, timeout) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

function FakePromise() {
	this.then = function() {
		return this;
	};
}

buster.testCase('when/timeout', {
	'should reject after timeout': function(done) {
		timeout(new FakePromise(), 0).then(
			fail,
			function(e) {
				assert(e instanceof Error);
			}
		).always(done);
	},

	'should not timeout when rejected before timeout': function(done) {
		timeout(when.reject(1), 0).then(
			fail,
			function(val) {
				assert.equals(val, 1);
			}
		).always(done);
	},

	'should not timeout when forcibly resolved before timeout': function(done) {
		timeout(when.resolve(1), 0).then(
			function(val) {
				assert.equals(val, 1);
			},
			fail
		).always(done);
	}

});
})(
	this.buster || require('buster'),
	this.when || require('..'),
	this.when_timeout || require('../timeout')
);
