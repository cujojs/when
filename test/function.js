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
			function throwingFn() {
				throw error;
			}

			var error = new Error();

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

	},

	'bind': {
		'should return a function': function() {
			assert.isFunction(fn.bind(f, null));
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
