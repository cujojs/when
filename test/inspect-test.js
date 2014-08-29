var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var inspect = require('../lib/decorators/inspect');
var CorePromise = inspect(require('../lib/Promise'));

var sentinel = { value: 'sentinel' };

function assertPending(s) {
	assert.equals(s.state, 'pending');
}

function assertFulfilled(s, value) {
	assert.equals(s.state, 'fulfilled');
	assert.same(s.value, value);
}

function assertRejected(s, reason) {
	assert.equals(s.state, 'rejected');
	assert.same(s.reason, reason);
}

buster.testCase('inspect', {

	'when inspecting promises': {
		'should return pending state for pending promise': function() {
			var promise = new CorePromise(function() {});

			assertPending(promise.inspect());
		},

		'should immediately return fulfilled state for fulfilled promise': function() {
			assertFulfilled(CorePromise.resolve(sentinel).inspect(), sentinel);
		},

		'should return fulfilled state for fulfilled promise': function() {
			var promise = CorePromise.resolve(sentinel);

			return promise.then(function() {
				assertFulfilled(promise.inspect(), sentinel);
			});
		},

		'should immediately return rejected state for rejected promise': function() {
			assertRejected(CorePromise.reject(sentinel).inspect(), sentinel);
		},

		'should return rejected state for rejected promise': function() {
			var promise = CorePromise.reject(sentinel);

			return promise.then(fail, function() {
				assertRejected(promise.inspect(), sentinel);
			});
		}
	},

	'when inspecting thenables': {
		'should return pending state for pending thenable': function() {
			var p = CorePromise.resolve({ then: function() {} });

			assertPending(p.inspect());
		},

		'should return fulfilled state for fulfilled thenable': function() {
			var p = CorePromise.resolve({ then: function(fulfill) { fulfill(sentinel); } });

			return p.then(function() {
				assertFulfilled(p.inspect(), sentinel);
			});
		},

		'should return rejected state for rejected thenable': function() {
			var p = CorePromise.resolve({ then: function(_, rejected) { rejected(sentinel); } });

			return p.then(fail, function() {
				assertRejected(p.inspect(), sentinel);
			});
		}
	}
});

