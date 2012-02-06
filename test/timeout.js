// Test boilerplate
var buster, assert, refute, when, when_timeout;

if (typeof require != "undefined") {
	buster = require("buster");
	when = require('../when');
	when_timeout = require('../timeout');
}

assert = buster.assert;
refute = buster.refute;
// end boilerplate

function FakePromise(val) {
	this.then = function() {
		return this;
	}
}

buster.testCase('when/timeout', {
	'should reject after timeout': function(done) {
		when_timeout(new FakePromise(1), 0).then(
			function() {
				buster.fail();
				done();
			},
			function(e) {
				assert(e instanceof Error);
				done();
			}
		);
	},

	'should not timeout when rejected before timeout': function(done) {
		var d = when.defer();
		d.reject(1);

		when_timeout(d, 0).then(
			function() {
				buster.fail();
				done();
			},
			function(val) {
				assert.equals(val, 1);
				done();
			}
		)
	},

	'should not timeout when forcibly resolved before timeout': function(done) {
		var d = when.defer();
		d.resolve(1);

		when_timeout(d, 0).then(
			function(val) {
				assert.equals(val, 1);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		)
	}

});