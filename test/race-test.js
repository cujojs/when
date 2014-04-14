var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var Promise = require('../lib/Promise');

var sentinel = { value: 'sentinel' };
var fulfilled = Promise.resolve(sentinel);
var rejected = Promise.reject(sentinel);
var never = Promise.never();

function delayReject(ms) {
	/*global setTimeout*/
	return new Promise(function(resolve) {
		setTimeout(function() {
			resolve(rejected);
		}, ms);
	});
}

buster.testCase('Promise.race', {
	'should return empty race for length 0': function() {
		assert.equals(never, Promise.race([]));
	},

	'should be identity for length 1': {
		'when fulfilled with value': function() {
			return Promise.race([sentinel]).then(function(x) {
				assert.same(x, sentinel);
			});
		},

		'when fulfilled via promise': function() {
			return Promise.race([fulfilled]).then(function(x) {
				assert.same(x, sentinel);
			});
		},

		'when rejected': function() {
			return Promise.race([rejected])
				.then(void 0, function(x) {
					assert.same(x, sentinel);
				});
		}
	},

	'should be commutative': {
		'when fulfilled': function() {
			return Promise.race([fulfilled, never]).then(function(x) {
				return Promise.race([never, fulfilled]).then(function(y) {
					assert.same(x, y);
				});
			});
		},

		'when rejected': function() {
			return Promise.race([rejected, never]).then(void 0, function(x) {
				return Promise.race([never, rejected]).then(void 0, function(y) {
					assert.same(x, y);
				});
			});
		}
	},

	'should fulfill when winner fulfills': function() {
		return Promise.race([delayReject(1), delayReject(1), fulfilled])
			.then(function(x) {
				assert.same(x, sentinel);
			}, fail);
	},

	'should reject when winner rejects': function() {
		return Promise.race([fulfilled.delay(1), fulfilled.delay(1), rejected])
			.then(fail, function(x) {
				assert.same(x, sentinel);
			});
	}
});
