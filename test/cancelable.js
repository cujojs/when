(function(buster, when, cancelable) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

buster.testCase('when/cancelable', {
	'should decorate deferred with a cancel() method': function() {
		var c = cancelable(when.defer(), function() {});
		assert(typeof c.cancel == 'function');
	},

	'should propagate a rejection when a cancelable deferred is canceled': function(done) {
		var c = cancelable(when.defer(), function() { return 1; });
		c.cancel();

		c.then(
			fail,
			function(v) {
				assert.equals(v, 1);
			}
		).always(done);
	},

	'should return a promise for canceled value when canceled': function(done) {
		var c, promise;

		c = cancelable(when.defer(), function() { return 1; });
		promise = c.cancel();

		promise.then(
			fail,
			function(v) {
				assert.equals(v, 1);
			}
		).always(done);
	},

	'should not invoke canceler when rejected normally': function(done) {
		var c = cancelable(when.defer(), function() { return 1; });
		c.reject(2);

		c.then(
			fail,
			function(v) {
				assert.equals(v, 2);
			}
		).always(done);
	},

	'should propagate the unaltered resolution value': function(done) {
		var c = cancelable(when.defer(), function() { return false; });
		c.resolve(true);

		c.then(assert, fail).always(done);
	},

	'should call progback for cancelable deferred': function(done) {
		var expected, c;

		expected = {};
		c = cancelable(when.defer());

		c.then(null, null, function (status) {
			assert.same(status, expected);
			done();
		});

		c.progress(expected);
	}

});

})(
	this.buster || require('buster'),
	this.when || require('..'),
	this.when_cancelable || require('../cancelable')
);
