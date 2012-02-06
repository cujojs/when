// Test boilerplate
var buster, assert, refute, when, when_cancelable;

if (typeof require != "undefined") {
	buster = require("buster");
	when = require('../when');
	when_cancelable = require('../cancelable');
}

assert = buster.assert;
refute = buster.refute;

// end boilerplate

function FakePromise(val) {
	this.then = function() {
		return this;
	}
}

buster.testCase('when/cancelable', {
	'should decorate deferred with a cancel() method': function() {
		var c = when_cancelable(when.defer(), function() {});
		assert.typeOf(c.cancel, 'function');
	},

	'should propagate a rejection when a cancelabled deferred is canceled': function(done) {
		var c = when_cancelable(when.defer(), function() { return 1; });
		c.cancel();

		c.then(
			function() {
				buster.fail();
				done();
			},
			function(v) {
				assert.equals(v, 1);
				done();
			}
		);
	},

	'should not invoke canceler when rejected normally': function(done) {
		var c = when_cancelable(when.defer(), function() { return 1; });
		c.reject(2);

		c.then(
			function() {
				buster.fail();
				done();
			},
			function(v) {
				assert.equals(v, 2);
				done();
			}
		);

	}
});