(function(buster, fn, when) {

var assert = buster.assert;
var fail   = buster.fail;

function assertIsPromise(something) {
  var message = 'Object is not a promise';
  buster.assert(when.isPromise(something), message);
}

function makeAsyncFunction() {
	return function async(cb, eb) {
		async.runCallback = cb;
		async.runErrback  = eb;
	};
}

function functionThatThrows(error) {
	return function throwing() {
		throw error;
	};
}

function f(x, y) {
	return x + y;
}

buster.testCase('when/function', {

	'apply': {
		'should return a promise': function() {
			var result = fn.apply(f, [1, 2]);
			assertIsPromise(result);
		},

		'should accept values for arguments': function() {
			var result = fn.apply(f, [1, 2]);
			return when(result, function(result) {
				assert.equals(result, 3);
			});
		},

		'should consider the arguments optional': function() {
			function countArgs() {
				return arguments.length;
			}

			fn.apply(countArgs).then(function(argCount) {
				assert.equals(argCount, 0);
			}, fail);
		},

		'should reject the promise when the function throws': function() {
			var error = new Error();
			var throwingFn = functionThatThrows(error);

			fn.apply(throwingFn).then(fail, function(reason) {
				assert.same(reason, error);
			});
		},

		'should maintain promise flattening semantics': function() {
			function returnsPromise(val) {
				return when.resolve(10 + val);
			}

			fn.apply(returnsPromise, [5]).then(function(value) {
				assert.equals(value, 15);
			}, fail);
		},
	},

	'call': {
		'should return a promise': function() {
			var result = fn.call(f, 1, 2);
			assertIsPromise(result);
		},

		'should accept values for arguments': function() {
			var result = fn.call(f, 1, 2);
			return when(result, function(result) {
				assert.equals(result, 3);
			});
		},

		'should consider the arguments optional': function() {
			function countArgs() {
				return arguments.length;
			}

			fn.call(countArgs).then(function(argCount) {
				assert.equals(argCount, 0);
			}, fail);
		},

		'should reject the promise when the function throws': function() {
			var error = new Error();
			var throwingFn = functionThatThrows(error);

			fn.call(throwingFn).then(fail, function(reason) {
				assert.same(reason, error);
			});
		},

		'should maintain promise flattening semantics': function() {
			function returnsPromise(val) {
				return when.resolve(10 + val);
			}

			fn.call(returnsPromise, 5).then(function(value) {
				assert.equals(value, 15);
			}, fail);
		},
	},

	'bind': {
		'should return a function': function() {
			assert.isFunction(fn.bind(f, null));
		},

		'the returned function': {
			'should return a promise': function() {
				var result = fn.bind(f);
				assertIsPromise(result(1, 2));
			},

			'should resolve the promise to its return value': function() {
				var result = fn.bind(f);
				result(1, 2).then(function(value) {
					assert.equals(value, 3);
				}, fail);
			},

			'should reject the promise upon error': function() {
				var error = new Error();
				var throwingFn = functionThatThrows(error);

				var result = fn.bind(throwingFn);
				result().then(fail, function(reason) {
					assert.same(reason, error);
				});
			}
		},

		'should accept leading arguments': function() {
			var curried = fn.bind(f, 5);

			curried(10).then(function(value) {
				assert.equals(value, 15);
			}, fail);
		},
	},

	'compose': {
		'should return a function': function() {
			var result = fn.compose(f);
			assert.isFunction(result);
		},

		'the returned function': {
			'should return a promise': function() {
				var returnedFunction = fn.compose(f);
				var result = returnedFunction();

				assertIsPromise(result);
			},

			'should be composed from the passed functions': function() {
				var sumWithFive = f.bind(null, 5);
				var sumWithTen  = f.bind(null, 10);

				var composed = fn.compose(sumWithFive, sumWithTen);
				composed(15).then(function(value) {
					assert.equals(value, 30);
				}, fail);
			},

			'should pass all its arguments to the first function': function() {
				var sumWithFive = f.bind(null, 5);

				var composed = fn.compose(f, sumWithFive);
				composed(10, 15).then(function(value) {
					assert.equals(value, 30);
				}, fail);
			},

			'should be transparent to returned promises': function() {
				var sumWithTen = f.bind(null, 10);

				var promisingSumWithTen = function(arg) {
					return when.resolve(sumWithTen(arg));
				};

				var composed = fn.compose(sumWithTen, promisingSumWithTen);
				composed(10).then(function(value) {
					assert.equals(value, 30);
				}, fail);
			},

			'should reject when the first function throws': function() {
				var error = new Error('Exception should be handled');
				var throwing = functionThatThrows(error);

				var composed = fn.compose(throwing, f);
				composed(5, 10).then(fail, function(reason) {
					assert.same(reason, error);
				});
			},

			'should reject when a composed function throws': function() {
				var error = new Error('Exception should be handled');
				var throwing = functionThatThrows(error);

				var composed = fn.compose(f, throwing);
				composed(5, 10).then(fail, function(reason) {
					assert.same(reason, error);
				});
			},

			'should reject if a composed function rejects': function() {
				var rejecting = function() { return when.reject('rejected'); };

				var composed = fn.compose(f, rejecting);
				composed(5, 10).then(fail, function(reason) {
					assert.equals(reason, 'rejected');
				});
			}
		},

		'should compose the functions on the given order': function() {
			function a(str) { return str + ' is';       }
			function b(str) { return str + ' really';   }
			function c(str) { return str + ' awesome!'; }

			var composed = fn.compose(a, b, c);

			composed('when.js').then(function(value) {
				assert.equals(value, 'when.js is really awesome!');
			}, fail);
		}
	},

	'promisify': {
		'should return a function': function() {
			var result = fn.promisify(makeAsyncFunction());
			assert.isFunction(result);
		},

		'the promise from the returned function': {
			'should resolve for the callback': function(done) {
				var async = makeAsyncFunction();
				var promisified = fn.promisify(async);

				promisified()
					.then(function(value) { assert.equals(value, 10); })
					.always(done);

				async.runCallback(10);
			},

			'should reject for the errback': function(done) {
				var async = makeAsyncFunction();
				var promisified = fn.promisify(async);

				promisified()
					.then(null, function(value) { assert.equals(value, 10); })
					.always(done);

				async.runErrback(10);
			},
		},

		'should accept functions with non-standard callback': function(done) {
			var async = makeAsyncFunction();

			function nonstandard(_, callback) { async(callback); }
			var promisified = fn.promisify(nonstandard, 1, 0);

			promisified()
				.then(function(value) { assert.equals(value, 10); })
				.always(done);

			async.runCallback(10);
		},

		'should accept functions with non-standard errback': function(done) {
			var async = makeAsyncFunction();

			function nonstandard(errback) { async(null, errback); }
			var promisified = fn.promisify(nonstandard, 1, 0);

			promisified()
				.then(null, function(value) { assert.equals(value, 10); })
				.always(done);

			async.runErrback(10);
		}
	}
});

})(
	this.buster  || require('buster'),
	this.when_fn || require('../function'),
	this.when    || require('../when')
);
