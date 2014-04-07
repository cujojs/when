var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when = require('../when');
var timeout = require('../timeout');

var sentinel = {};

function FakePromise() {
	this.then = function() {
		return this;
	};
}

buster.testCase('when/timeout', {
	'should reject after timeout': function(done) {
		timeout(10, new FakePromise()).then(
			fail,
			function(e) {
				assert(e instanceof Error);
			}
		).ensure(done);
	},

	'should not timeout when rejected before timeout': function(done) {
		timeout(10, when.reject(sentinel)).then(
			fail,
			function(val) {
				assert.same(val, sentinel);
			}
		).ensure(done);
	},

	'should not timeout when forcibly resolved before timeout': function(done) {
		timeout(10, when.resolve(sentinel)).then(
			function(val) {
				assert.same(val, sentinel);
			},
			fail
		).ensure(done);
	},

	'should propagate progress': function(done) {
		var d = when.defer();

		timeout(10, d.promise).then(null, null,
			function(val) {
				assert.same(val, sentinel);
				d.resolve();
			}
		).ensure(done);

		d.notify(sentinel);
	},

	'promise.timeout': {

		'should reject after timeout': function(done) {
			when.defer().promise.timeout(10).then(
				fail,
				function(e) {
					assert(e instanceof Error);
				}
			).ensure(done);
		},

		'should reject after timeout with the provided reason': function(done) {
			when.defer().promise.timeout(10, sentinel).then(
				fail,
				function(reason) {
					assert.same(reason, sentinel);
				}
			).ensure(done);
		},

		'should reject after timeout with the provided reason, even if undefined': function(done) {
			when.defer().promise.timeout(10, void 0).then(
				fail,
				function(reason) {
					assert.same(reason, void 0);
				}
			).ensure(done);
		},

		'should not timeout when rejected before timeout': function(done) {
			when.reject(sentinel).timeout(10).then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			).ensure(done);
		},

		'should not timeout when forcibly resolved before timeout': function(done) {
			when.resolve(sentinel).timeout(10).then(
				function(val) {
					assert.same(val, sentinel);
				},
				fail
			).ensure(done);
		},

		'should propagate progress': function(done) {
			var d = when.defer();

			d.promise.timeout(10).then(null, null,
				function(val) {
					assert.same(val, sentinel);
					d.resolve();
				}
			).ensure(done);

			d.notify(sentinel);
		}

	}
});
