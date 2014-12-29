var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var CorePromise = require('../lib/Promise');

var sentinel = { value: 'sentinel' };
var fulfilled = CorePromise.resolve(sentinel);
var never = CorePromise.never();

function delayReject(ms) {
	/*global setTimeout*/
	return new CorePromise(function(resolve, reject) {
		setTimeout(function() {
			reject(sentinel);
		}, ms);
	});
}

buster.testCase('CorePromise.race', {
	'should return empty race for length 0': function() {
		assert.equals(never, CorePromise.race([]));
	},

	'should reject with TypeError when passed a non-iterable (array in es5)': function() {
		return CorePromise.race(null).then(fail, function(e) {
			assert(e instanceof TypeError);
		});
	},

	'should be identity for length 1': {
		'when fulfilled with value': function() {
			return CorePromise.race([sentinel]).then(function(x) {
				assert.same(x, sentinel);
			});
		},

		'when fulfilled via promise': function() {
			return CorePromise.race([fulfilled]).then(function(x) {
				assert.same(x, sentinel);
			});
		},

		'when rejected': function() {
			var rejected = CorePromise.reject(sentinel);
			return CorePromise.race([rejected])
				.then(void 0, function(x) {
					assert.same(x, sentinel);
				});
		}
	},

	'should be commutative': {
		'when fulfilled': function() {
			return CorePromise.race([fulfilled, never]).then(function(x) {
				return CorePromise.race([never, fulfilled]).then(function(y) {
					assert.same(x, y);
				});
			});
		},

		'when rejected': function() {
			var rejected = CorePromise.reject(sentinel);
			return CorePromise.race([rejected, never]).then(void 0, function(x) {
				return CorePromise.race([never, rejected]).then(void 0, function(y) {
					assert.same(x, y);
				});
			});
		}
	},

	'should fulfill when winner fulfills': function() {
		return CorePromise.race([delayReject(1), delayReject(1), fulfilled])
			.then(function(x) {
				assert.same(x, sentinel);
			}, fail);
	},

	'should reject when winner rejects': function() {
		var rejected = CorePromise.reject(sentinel);
		return CorePromise.race([fulfilled.delay(1), fulfilled.delay(1), rejected])
			.then(fail, function(x) {
				assert.same(x, sentinel);
			});
	}
});
