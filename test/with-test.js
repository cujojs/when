var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var CorePromise = require('../lib/Promise');
var sentinel = { value: 'sentinel' };

buster.testCase('promise.with', {
	'should set thisArg': function() {
		return CorePromise.resolve()['with'](sentinel).then(function() {
			assert.same(this, sentinel);
		});
	},

	'should set thisArg when rejected': function() {
		return CorePromise.reject()['with'](sentinel).then(void 0, function() {
			assert.same(this, sentinel);
		});
	},

	'should set thisArg for derived promises': function() {
		return CorePromise.resolve()['with'](sentinel).then(function(x) {
			return x;
		}).then(function() {
			assert.same(this, sentinel);
		});
	},

	'should set thisArg for derived promises when rejected': function() {
		return CorePromise.resolve()['with'](sentinel).then(function(x) {
			throw x;
		}).then(void 0, function() {
			assert.same(this, sentinel);
		});
	},

	'when called with no args': {
		'should set default thisArg': function() {
			var expected;
			return CorePromise.resolve().then(function() {
				expected = this;
			})
			['with'](sentinel).then(function() {
				assert.same(this, sentinel);
			})
			['with']().then(function() {
				assert.same(this, expected);
			});
		},

		'should set default thisArg when rejected': function() {
			var expected;
			return CorePromise.resolve().then(function() {
				expected = this;
			})
			['with'](sentinel).then(function() {
				assert.same(this, sentinel);
				throw sentinel;
			})
			['with']().then(void 0, function() {
				assert.same(this, expected);
			});
		},

		'should set default thisArg for derived promises': function() {
			var expected;
			return CorePromise.resolve().then(function() {
				expected = this;
			})
			['with'](sentinel).then(function() {
				assert.same(this, sentinel);
			})
			['with']().then(function(x) {
				return x;
			})
			.then(function() {
				assert.same(this, expected);
			});
		},

		'should set default thisArg for derived promises when rejected': function() {
			var expected;
			return CorePromise.resolve().then(function() {
				expected = this;
			})
			['with'](sentinel).then(function() {
				assert.same(this, sentinel);
			})
			['with']().then(function(x) {
				throw x;
			})
			.then(void 0, function() {
				assert.same(this, expected);
			});
		}
	},

	'when called with non-object': {
		'should mimic Function.prototype.call behavior': function() {
			var thisArg = 123;

			var expected = (function() {
				return this;
			}).call(thisArg);

			return CorePromise.resolve()['with'](thisArg).then(function() {
				assert.equals(this, expected);
			});
		},

		'should mimic Function.prototype.call behavior when rejected': function() {
			var thisArg = 123;

			var expected = (function() {
				return this;
			}).call(thisArg);

			return CorePromise.reject()['with'](thisArg).then(void 0, function() {
				assert.equals(this, expected);
			});
		}
	}
});
