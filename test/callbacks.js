(function(buster, when, callbacks) {

var assert = buster.assert;
var fail   = buster.fail;

var assertIsPromise = function(arg) {
	assert(when.isPromise(arg));
};

buster.testCase('when/callbacks', {
	'apply': {
		'should return a promise': function() {
			assertIsPromise(callbacks.apply(function() {}));
		},

		'should resolve with the callback arguments': function(done) {
			var callback;
			var promise = callbacks.apply(function(cb) {
				callback = cb;
			});

			callback(15);

			promise.then(function(val) {
				assert.equals(val, 15);
			}, fail).always(done);
		},

		'should reject with the errback arguments': function(done) {
			var errback;
			var promise = callbacks.apply(function(cb, eb){
				errback = eb;
			});

			errback('error');

			promise.then(fail, function(reason) {
				assert.equals(reason, 'error');
			}).always(done);
		},

		'should forward its second argument to the function': function(done) {
      var async = function(a, b, cb/*, eb*/) {
				cb(a + b);
			};

			var promise = callbacks.apply(async, [10, 15]);

			promise.then(function(result) {
				assert.equals(result, 25);
			}, fail).always(done);
		}
	},

	'call': {
		'should return a promise': function() {
			assertIsPromise(callbacks.call(function() {}));
		},

		'should resolve with the callback arguments': function(done) {
			var callback;
			var promise = callbacks.call(function(cb) {
				callback = cb;
			});

			callback(15);

			promise.then(function(val) {
				assert.equals(val, 15);
			}, fail).always(done);
		},

		'should reject with the errback arguments': function(done) {
			var errback;
			var promise = callbacks.call(function(cb, eb){
				errback = eb;
			});

			errback('error');

			promise.then(fail, function(reason) {
				assert.equals(reason, 'error');
			}).always(done);
		},

		'should forward its extra arguments to the function': function(done) {
      var async = function(a, b, cb/*, eb*/) {
				cb(a + b);
			};

			var promise = callbacks.call(async, 10, 15);

			promise.then(function(result) {
				assert.equals(result, 25);
			}, fail).always(done);
		}
	},

	'bind': {
		'should return a function': function() {
			assert.isFunction(callbacks.bind(function() {}));
		},

		'the returned function': {
			'should return a promise': function() {
				var result = callbacks.bind(function() {});
				assertIsPromise(result());
			},

			'should resolve the promise with the callback value': function(done) {
				var result = callbacks.bind(function(cb) {
					cb(10);
				});

				result().then(function(value) {
					assert.equals(value, 10);
				}, fail).always(done);
			},

			'should forward arguments to the original function': function(done) {
				var result = callbacks.bind(function(a, b, cb) {
					cb(a + b);
				});

				result(10, 15).then(function(value) {
					assert.equals(value, 25);
				}, fail).always(done);
			},

			'should reject the promise with the errback value': function(done) {
				var error = new Error();
				var result = callbacks.bind(function(cb, eb) {
					eb(error);
				});

				result().then(fail, function(reason) {
					assert.same(reason, error);
				}).always(done);
			}
		},

		'should accept leading arguments': function(done) {
			function fancySum(x, y, callback) {
				callback(x + y);
			}

			var partiallyApplied = callbacks.bind(fancySum, 5);

			partiallyApplied(10).then(function(value) {
				assert.equals(value, 15);
			}, fail).always(done);
		},
	},
});

})(
	this.buster    || require('buster'),
	this.when      || require('..'),
	this.callbacks || require('../callbacks')
);
