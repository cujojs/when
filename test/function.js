(function(buster, fn, when) {

var assert = buster.assert;
var fail   = buster.fail;

function assertIsPromise(something) {
  var message = 'Object is not a promise';
  buster.assert(when.isPromise(something), message);
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

		'should accept values for arguments': function(done) {
			var result = fn.apply(f, [1, 2]);
			return when(result, function(result) {
				assert.equals(result, 3);
			}).always(done);
		},

		'should accept promises for arguments': function(done) {
			var result = fn.apply(f, [when(1), 2]);
			return when(result, function(result) {
				assert.equals(result, 3);
			}).always(done);
		},

		'should consider the arguments optional': function(done) {
			function countArgs() {
				return arguments.length;
			}

			fn.apply(countArgs).then(function(argCount) {
				assert.equals(argCount, 0);
			}, fail).always(done);
		},

		'should reject the promise when the function throws': function(done) {
			var error = new Error();
			var throwingFn = functionThatThrows(error);

			fn.apply(throwingFn).then(fail, function(reason) {
				assert.same(reason, error);
			}).always(done);
		},

		'should maintain promise flattening semantics': function(done) {
			function returnsPromise(val) {
				return when.resolve(10 + val);
			}

			fn.apply(returnsPromise, [5]).then(function(value) {
				assert.equals(value, 15);
			}, fail).always(done);
		},
	},

	'call': {
		'should return a promise': function() {
			var result = fn.call(f, 1, 2);
			assertIsPromise(result);
		},

		'should accept values for arguments': function(done) {
			var result = fn.call(f, 1, 2);
			return when(result, function(result) {
				assert.equals(result, 3);
			}).always(done);
		},

		'should accept promises for arguments': function(done) {
			var result = fn.call(f, when(1), 2);
			return when(result, function(result) {
				assert.equals(result, 3);
			}).always(done);
		},

		'should consider the arguments optional': function(done) {
			function countArgs() {
				return arguments.length;
			}

			fn.call(countArgs).then(function(argCount) {
				assert.equals(argCount, 0);
			}, fail).always(done);
		},

		'should reject the promise when the function throws': function(done) {
			var error = new Error();
			var throwingFn = functionThatThrows(error);

			fn.call(throwingFn).then(fail, function(reason) {
				assert.same(reason, error);
			}).always(done);
		},

		'should maintain promise flattening semantics': function(done) {
			function returnsPromise(val) {
				return when.resolve(10 + val);
			}

			fn.call(returnsPromise, 5).then(function(value) {
				assert.equals(value, 15);
			}, fail).always(done);
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

			'should resolve the promise to its return value': function(done) {
				var result = fn.bind(f);
				result(1, 2).then(function(value) {
					assert.equals(value, 3);
				}, fail).always(done);
			},

			'should accept promises for arguments': function(done) {
				var result = fn.bind(f);

				result(1, when(2)).then(function(value) {
					assert.equals(value, 3);
				}, fail).always(done);
			},

			'should reject the promise upon error': function(done) {
				var error = new Error();
				var throwingFn = functionThatThrows(error);

				var result = fn.bind(throwingFn);
				result().then(fail, function(reason) {
					assert.same(reason, error);
				}).always(done);
			}
		},

		'should accept leading arguments': function(done) {
			var partiallyApplied = fn.bind(f, 5);

			partiallyApplied(10).then(function(value) {
				assert.equals(value, 15);
			}, fail).always(done);
		},

		'should accept promises as leading arguments': function(done) {
			var partiallyApplied = fn.bind(f, when(5));

			partiallyApplied(10).then(function(value) {
				assert.equals(value, 15);
			}, fail).always(done);
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

			'should be composed from the passed functions': function(done) {
				var sumWithFive = f.bind(null, 5);
				var sumWithTen  = f.bind(null, 10);

				var composed = fn.compose(sumWithFive, sumWithTen);
				composed(15).then(function(value) {
					assert.equals(value, 30);
				}, fail).always(done);
			},

			'should pass all its arguments to the first function': function(done) {
				var sumWithFive = f.bind(null, 5);

				var composed = fn.compose(f, sumWithFive);
				composed(10, 15).then(function(value) {
					assert.equals(value, 30);
				}, fail).always(done);
			},

			'should accept promises for arguments': function(done) {
				var sumWithFive = f.bind(null, 5);

				var composed = fn.compose(f, sumWithFive);
				composed(when(10), 15).then(function(value) {
					assert.equals(value, 30);
				}, fail).always(done);
			},

			'should be transparent to returned promises': function(done) {
				var sumWithTen = f.bind(null, 10);

				var promisingSumWithTen = function(arg) {
					return when.resolve(sumWithTen(arg));
				};

				var composed = fn.compose(sumWithTen, promisingSumWithTen);
				composed(10).then(function(value) {
					assert.equals(value, 30);
				}, fail).always(done);
			},

			'should reject when the first function throws': function(done) {
				var error = new Error('Exception should be handled');
				var throwing = functionThatThrows(error);

				var composed = fn.compose(throwing, f);
				composed(5, 10).then(fail, function(reason) {
					assert.same(reason, error);
				}).always(done);
			},

			'should reject when a composed function throws': function(done) {
				var error = new Error('Exception should be handled');
				var throwing = functionThatThrows(error);

				var composed = fn.compose(f, throwing);
				composed(5, 10).then(fail, function(reason) {
					assert.same(reason, error);
				}).always(done);
			},

			'should reject if a composed function rejects': function(done) {
				var rejecting = function() { return when.reject('rejected'); };

				var composed = fn.compose(f, rejecting);
				composed(5, 10).then(fail, function(reason) {
					assert.equals(reason, 'rejected');
				}).always(done);
			}
		},

		'should compose the functions on the given order': function(done) {
			function a(str) { return str + ' is';       }
			function b(str) { return str + ' really';   }
			function c(str) { return str + ' awesome!'; }

			var composed = fn.compose(a, b, c);

			composed('when.js').then(function(value) {
				assert.equals(value, 'when.js is really awesome!');
			}, fail).always(done);
		}
	},
});

})(
	this.buster  || require('buster'),
	this.when_fn || require('../function'),
	this.when    || require('../when')
);
