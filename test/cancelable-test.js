var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when = require('../when');
var cancelable = require('../cancelable');

var sentinel = {};
var other = {};

buster.testCase('when/cancelable', {
	'should decorate deferred with a cancel() method': function() {
		var c = cancelable(when.defer(), function() {});
		assert(typeof c.cancel == 'function');
	},

	'should propagate a rejection when a cancelable deferred is canceled': function(done) {
		var c = cancelable(when.defer(), function() { return sentinel; });
		c.cancel();

		c.promise.then(
			fail,
			function(v) {
				assert.equals(v, sentinel);
			}
		).ensure(done);
	},

	'should return a promise for canceled value when canceled': function(done) {
		var c, promise;

		c = cancelable(when.defer(), function() { return sentinel; });
		promise = c.cancel();

		promise.then(
			fail,
			function(v) {
				assert.equals(v, sentinel);
			}
		).ensure(done);
	},

	'should not invoke canceler when rejected normally': function(done) {
		var c = cancelable(when.defer(), function() { return other; });
		c.reject(sentinel);
		c.cancel();

		c.promise.then(
			fail,
			function(v) {
				assert.equals(v, sentinel);
			}
		).ensure(done);
	},

	'should propagate the unaltered resolution value': function(done) {
		var c = cancelable(when.defer(), function() { return other; });
		c.resolve(sentinel);
		c.cancel();

		c.promise.then(
			function(val) {
				assert.same(val, sentinel);
			},
			function(e) {
				fail(e);
			}
		).ensure(done);
	},

	'should call progback for cancelable deferred': function(done) {
		var c = cancelable(when.defer());

		c.promise.then(null, null, function (status) {
			assert.same(status, sentinel);
			done();
		});

		c.notify(sentinel);
	}

});
