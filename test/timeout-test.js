var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var CorePromise = require('../lib/Promise');
var TimeoutError = require('../lib/TimeoutError');
var timeout = require('../timeout');

var sentinel = {};

function FakePromise() {
	this.then = function() {
		return this;
	};
}

buster.testCase('when/timeout', {
	'should reject with TimeoutError': function(done) {
		timeout(10, new FakePromise()).then(
			fail,
			function(e) {
				assert(e instanceof TimeoutError);
			}
		).ensure(done);
	},

	'should not timeout when rejected before timeout': function(done) {
		timeout(10, CorePromise.reject(sentinel)).then(
			fail,
			function(val) {
				assert.same(val, sentinel);
			}
		).ensure(done);
	},

	'should not timeout when resolved before timeout': function(done) {
		timeout(10, CorePromise.resolve(sentinel)).then(
			function(val) {
				assert.same(val, sentinel);
			},
			fail
		).ensure(done);
	},

	'promise.timeout': {

		'should reject with TimeoutError': function() {
			return CorePromise.never().timeout(0).then(
				fail,
				function(e) {
					assert(e instanceof TimeoutError);
				}
			);
		},

		'should pattern match': function() {
			return CorePromise.never().timeout(0).catch(TimeoutError, function(e) {
				assert(e instanceof TimeoutError);
			});
		},

		'should reject after timeout with the provided reason': function() {
			return CorePromise.never().timeout(0, sentinel).then(
				fail,
				function(e) {
					assert.same(e, sentinel);
				}
			);
		},

		'should reject after timeout with default reason when undefined': function() {
			return CorePromise.never().timeout(0, void 0).then(
				fail,
				function(e) {
					assert(e instanceof TimeoutError);
				}
			);
		},

		'should not timeout when rejected before timeout': function() {
			return CorePromise.reject(sentinel).timeout(0).then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			);
		},

		'should not timeout when resolved before timeout': function() {
			return CorePromise.resolve(sentinel).timeout(0).then(
				function(val) {
					assert.same(val, sentinel);
				}
			);
		},

		'should propagate progress': function(done) {
			return new CorePromise(function(resolve, _, notify) {
				notify(sentinel);
			})
				.timeout(10)
				.then(void 0, void 0, function(x) {
					assert.same(x, sentinel);
					done();
				});
		}

	}
});
