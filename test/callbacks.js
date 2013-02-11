(function(buster, when, callbacks) {

var assert, fail, sentinel;

assert = buster.assert;
fail   = buster.fail;

sentinel = {};

function assertIsPromise(arg) {
	assert(when.isPromise(arg));
}

buster.testCase('when/callbacks', {
	'apply': {
		'should return a promise': function() {
			assertIsPromise(callbacks.apply(function() {}));
		},

		'should resolve with the callback arguments': function(done) {
			var promise = callbacks.apply(function(cb) {
				cb(sentinel);
			});

			promise.then(function(val) {
				assert.same(val, sentinel);
			}, fail).always(done);
		},

		'should reject with the errback arguments': function(done) {
			var promise = callbacks.apply(function(cb, eb){
				eb(sentinel);
			});

			promise.then(fail, function(reason) {
				assert.same(reason, sentinel);
			}).always(done);
		},

		'should turn exceptions into rejections': function(done) {
			var error = new Error();
			var promise = callbacks.apply(function(){
				throw error;
			});

			promise.then(fail, function(reason) {
				assert.equals(reason, error);
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
		},

		'should turn multiple callback values into an array': function(done) {
			var async = function(a, b, cb/*, eb*/) {
				cb(a * 10, b * 20);
			};

			var promise = callbacks.apply(async, [10, 20]);
			promise.then(function(results) {
				assert.equals(results, [100, 400]);
			}, fail).always(done);
		},

		'should accept promises on the extra arguments': function(done) {
			var async = function(a, b, cb/*, eb*/) {
				cb(a + b);
			};

			var promise = callbacks.apply(async, [when(10), 15]);

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
			var promise = callbacks.apply(function(cb) {
				cb(sentinel);
			});

			promise.then(function(val) {
				assert.same(val, sentinel);
			}, fail).always(done);
		},

		'should reject with the errback arguments': function(done) {
			var promise = callbacks.apply(function(cb, eb){
				eb(sentinel);
			});

			promise.then(fail, function(reason) {
				assert.same(reason, sentinel);
			}).always(done);
		},

		'should turn exceptions into rejections': function(done) {
			var error = new Error();
			var promise = callbacks.call(function(){
				throw error;
			});

			promise.then(fail, function(reason) {
				assert.equals(reason, error);
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
		},

		'should turn multiple callback values into an array': function(done) {
			var async = function(a, b, cb/*, eb*/) {
				cb(a * 10, b * 20);
			};

			var promise = callbacks.call(async, 10, 20);
			promise.then(function(results) {
				assert.equals(results, [100, 400]);
			}, fail).always(done);
		},

		'should accept promises on the extra arguments': function(done) {
			var async = function(a, b, cb/*, eb*/) {
				cb(a + b);
			};

			var promise = callbacks.call(async, when(10), 15);

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
			},

			'should turn exceptions into rejections': function(done) {
				var error = new Error();
				var result = callbacks.bind(function(){
					throw error;
				});

				result().then(fail, function(reason) {
					assert.equals(reason, error);
				}).always(done);
			},

			'should turn multiple callback values into an array': function(done) {
				var result = callbacks.bind(function(a, b, cb/*, eb*/) {
					cb(a * 10, b * 20);
				});

				result(10, 20).then(function(results) {
					assert.equals(results, [100, 400]);
				}, fail).always(done);
			},

			'should accept promises as arguments': function(done) {
				var result = callbacks.bind(function(a, b, cb/*, eb*/) {
					cb(a + b);
				});

				result(when(10), 15).then(function(result) {
					assert.equals(result, 25);
				}, fail).always(done);
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

		'should accept promises as leading arguments': function(done) {
			function fancySum(x, y, callback) {
				callback(x + y);
			}

			var partiallyApplied = callbacks.bind(fancySum, when(5));

			partiallyApplied(10).then(function(value) {
				assert.equals(value, 15);
			}, fail).always(done);
		}
	},

	'promisify': {
		'should support callbacks in any position': function(done) {
			function weirdAsync(a, callback, b) {
				callback(a + b);
			}

			var promisified = callbacks.promisify(weirdAsync, {
				callback: 1
			});

			promisified(10, 5).then(function(result) {
				assert.equals(result, 15);
			}, fail).always(done);
		},

		'should support errbacks in any position': function(done) {
			function weirdAsync(errback, a, callback, b) {
				errback(a + b);
			}

			var promisified = callbacks.promisify(weirdAsync, {
				callback: 2,
				errback:  0
			});

			promisified(10, 5).then(fail, function(reason) {
				assert.equals(reason, 15);
			}).always(done);
		},

		'should turn multiple callback values into an array': function(done) {
			function invert(cb, eb, a, b) {
				cb(b, a);
			}

			var promisified = callbacks.promisify(invert, {
				callback: 0,
				errback:  1
			});

			promisified(10, 20).then(function(results) {
				assert.equals(results, [20, 10]);
			}, fail).always(done);
		},

		'should turn exceptions into rejections': function(done) {
			var error = new Error();
			var result = callbacks.promisify(function(){
				throw error;
			}, {});

			result().then(fail, function(reason) {
				assert.equals(reason, error);
			}).always(done);
		},

		'should accept promises as arguments': function(done) {
			var result = callbacks.promisify(function(a, b, cb/*, eb*/) {
				cb(a + b);
			}, {
				callback: -2,
				errback:  -1
			});

			result(when(10), 15).then(function(result) {
				assert.equals(result, 25);
			}, fail).always(done);
		},

		'should understand -1 as "the last argument"': function(done) {
			function asyncSum(/*n1, n2, n3...callback*/) {
				var args = [].slice.call(arguments, 0);

				var callback = args.pop();

				var result = args.reduce(function(prev, n) {
					return prev + n;
				});
				callback(result);
			}

			var promisified = callbacks.promisify(asyncSum, {
				callback: -1
			});

			promisified(5, 10, 15).then(function(result) {
				assert.equals(result, 30);
			}, fail).always(done);
		},

		'should understand -2 as "the penultimate argument"': function(done) {
			function asyncConcat(/*str1, str2, str3...errback, callback*/) {
				var args = [].slice.call(arguments, 0);

				/*var callback =*/ args.pop();
				var errback = args.pop();

				var result = args.reduce(function(prev, n) {
					return prev + ' ' + n;
				});

				errback(result);
			}

			var promisified = callbacks.promisify(asyncConcat, {
				errback: -2,
				callback: -1
			});

			var promise = promisified('That\'s', 'an', 'extreme', 'example');
			promise.then(fail, function(reason) {
				assert.equals(reason, 'That\'s an extreme example');
			}).always(done);
		}
	}
});

})(
	this.buster    || require('buster'),
	this.when      || require('..'),
	this.callbacks || require('../callbacks')
);
