(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.fail;

sentinel = {};

define('when/callbacks-test', function (require) {

	var callbacks, when;

	callbacks = require('when/callbacks');
	when = require('when');

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
				}, fail).ensure(done);
			},

			'should reject with the errback arguments': function(done) {
				var promise = callbacks.apply(function(cb, eb){
					eb(sentinel);
				});

				promise.then(fail, function(reason) {
					assert.same(reason, sentinel);
				}).ensure(done);
			},

			'should turn exceptions into rejections': function(done) {
				var error = new Error();
				var promise = callbacks.apply(function(){
					throw error;
				});

				promise.then(fail, function(reason) {
					assert.equals(reason, error);
				}).ensure(done);
			},

			'should forward its second argument to the function': function(done) {
				var async = function(a, b, cb/*, eb*/) {
					cb(a + b);
				};

				var promise = callbacks.apply(async, [10, 15]);

				promise.then(function(result) {
					assert.equals(result, 25);
				}, fail).ensure(done);
			},

			'should turn multiple callback values into an array': function(done) {
				var async = function(a, b, cb/*, eb*/) {
					cb(a * 10, b * 20);
				};

				var promise = callbacks.apply(async, [10, 20]);
				promise.then(function(results) {
					assert.equals(results, [100, 400]);
				}, fail).ensure(done);
			},

			'should accept promises on the extra arguments': function(done) {
				var async = function(a, b, cb/*, eb*/) {
					cb(a + b);
				};

				var promise = callbacks.apply(async, [when(10), 15]);

				promise.then(function(result) {
					assert.equals(result, 25);
				}, fail).ensure(done);
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
				}, fail).ensure(done);
			},

			'should reject with the errback arguments': function(done) {
				var promise = callbacks.apply(function(cb, eb){
					eb(sentinel);
				});

				promise.then(fail, function(reason) {
					assert.same(reason, sentinel);
				}).ensure(done);
			},

			'should turn exceptions into rejections': function(done) {
				var error = new Error();
				var promise = callbacks.call(function(){
					throw error;
				});

				promise.then(fail, function(reason) {
					assert.equals(reason, error);
				}).ensure(done);
			},

			'should forward its extra arguments to the function': function(done) {
				var async = function(a, b, cb/*, eb*/) {
					cb(a + b);
				};

				var promise = callbacks.call(async, 10, 15);

				promise.then(function(result) {
					assert.equals(result, 25);
				}, fail).ensure(done);
			},

			'should turn multiple callback values into an array': function(done) {
				var async = function(a, b, cb/*, eb*/) {
					cb(a * 10, b * 20);
				};

				var promise = callbacks.call(async, 10, 20);
				promise.then(function(results) {
					assert.equals(results, [100, 400]);
				}, fail).ensure(done);
			},

			'should accept promises on the extra arguments': function(done) {
				var async = function(a, b, cb/*, eb*/) {
					cb(a + b);
				};

				var promise = callbacks.call(async, when(10), 15);

				promise.then(function(result) {
					assert.equals(result, 25);
				}, fail).ensure(done);
			}
		},

		'bind': {
			'should be an alias for lift': function() {
				assert.same(callbacks.bind, callbacks.lift);
			}
		},

		'lift': {
			'should return a function': function() {
				assert.isFunction(callbacks.lift(function() {}));
			},

			'the returned function': {
				'should return a promise': function() {
					var result = callbacks.lift(function() {});
					assertIsPromise(result());
				},

				'should resolve the promise with the callback value': function(done) {
					var result = callbacks.lift(function(cb) {
						cb(10);
					});

					result().then(function(value) {
						assert.equals(value, 10);
					}, fail).ensure(done);
				},

				'should forward arguments to the original function': function(done) {
					var result = callbacks.lift(function(a, b, cb) {
						cb(a + b);
					});

					result(10, 15).then(function(value) {
						assert.equals(value, 25);
					}, fail).ensure(done);
				},

				'should reject the promise with the errback value': function(done) {
					var error = new Error();
					var result = callbacks.lift(function(cb, eb) {
						eb(error);
					});

					result().then(fail, function(reason) {
						assert.same(reason, error);
					}).ensure(done);
				},

				'should turn exceptions into rejections': function(done) {
					var error = new Error();
					var result = callbacks.lift(function(){
						throw error;
					});

					result().then(fail, function(reason) {
						assert.equals(reason, error);
					}).ensure(done);
				},

				'should turn multiple callback values into an array': function(done) {
					var result = callbacks.lift(function(a, b, cb/*, eb*/) {
						cb(a * 10, b * 20);
					});

					result(10, 20).then(function(results) {
						assert.equals(results, [100, 400]);
					}, fail).ensure(done);
				},

				'should accept promises as arguments': function(done) {
					var result = callbacks.lift(function(a, b, cb/*, eb*/) {
						cb(a + b);
					});

					result(when(10), 15).then(function(result) {
						assert.equals(result, 25);
					}, fail).ensure(done);
				}
			},

			'should accept leading arguments': function(done) {
				function fancySum(x, y, callback) {
					callback(x + y);
				}

				var partiallyApplied = callbacks.lift(fancySum, 5);

				partiallyApplied(10).then(function(value) {
					assert.equals(value, 15);
				}, fail).ensure(done);
			},

			'should accept promises as leading arguments': function(done) {
				function fancySum(x, y, callback) {
					callback(x + y);
				}

				var partiallyApplied = callbacks.lift(fancySum, when(5));

				partiallyApplied(10).then(function(value) {
					assert.equals(value, 15);
				}, fail).ensure(done);
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
				}, fail).ensure(done);
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
				}).ensure(done);
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
				}, fail).ensure(done);
			},

			'should turn exceptions into rejections': function(done) {
				var error = new Error();
				var result = callbacks.promisify(function(){
					throw error;
				}, {});

				result().then(fail, function(reason) {
					assert.equals(reason, error);
				}).ensure(done);
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
				}, fail).ensure(done);
			},

			'should understand -1 as "the last argument"': function(done) {
				function asyncSum(/*n1, n2, n3...errback, callback*/) {
					arguments[arguments.length - 1](sentinel);
				}

				var promisified = callbacks.promisify(asyncSum, {
					errback: -2,
					callback: -1
				});

				promisified(0, 1, 2).then(
					function(val) {
						assert.same(val, sentinel);
					},
					fail
				).ensure(done);
			},

			'should understand -2 as "the penultimate argument"': function(done) {
				function asyncConcat(/*str1, str2, str3...errback, callback*/) {
					arguments[arguments.length - 2](sentinel);
				}

				var promisified = callbacks.promisify(asyncConcat, {
					errback: -2,
					callback: -1
				});

				promisified(0, 1, 2).then(
					fail,
					function(val) {
						assert.same(val, sentinel);
					}
				).ensure(done);
			}
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
