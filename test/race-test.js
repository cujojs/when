(function(buster, define) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

define('when/race-test', function (require) {

	var Promise = require('when/lib/Promise');
	var sentinel = { value: 'sentinel' };
	var fulfilled = Promise.resolve(sentinel);
	var rejected = Promise.reject(sentinel);
	var never = Promise.never();

	function delayReject(ms) {
		return Promise.resolve().delay(ms)['yield'](rejected);
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

});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-\.]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
