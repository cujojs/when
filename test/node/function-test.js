(function(buster, define) {
var assert = buster.assert;
var fail   = buster.fail;

define('when/node/function-test', function (require) {

	var nodefn, when;

	nodefn = require('when/node/function');
	when = require('when');

	function assertIsPromise(something) {
		var message = 'Object is not a promise';
		buster.assert(when.isPromise(something), message);
	}

	buster.testCase('when/node/function', {
		'apply': {
			'should return promise': function() {
				var result = nodefn.apply(function() {});
				assertIsPromise(result);
			},

			'the returned promise': {
				'should be resolved with the 2nd arg to the callback': function(done) {
					function async(cb) {
						cb(null, 10);
					}

					var promise = nodefn.apply(async);
					promise.then(function(value) {
						assert.equals(value, 10);
					}, fail).ensure(done);
				},

				'should be rejected with the 1st arg to the callback': function(done) {
					var error = new Error('foobar');
					function async(cb) {
						cb(error);
					}

					var promise = nodefn.apply(async);
					promise.then(fail, function(reason) {
						assert.same(reason, error);
					}).ensure(done);
				},

				'should be resolved to an array for multi-arg callbacks': function(done) {
					function async(cb) {
						cb(null, 10, 20, 30);
					}

					var promise = nodefn.apply(async);
					promise.then(function(values) {
						assert.equals(values, [10, 20, 30]);
					}).ensure(done);
				}
			},

			'should forward an array of args to the function': function(done) {
				function async(x, y, cb) {
					cb(null, x + y);
				}

				var promise = nodefn.apply(async, [10, 20]);
				promise.then(function(value) {
					assert.equals(value, 30);
				}).ensure(done);
			},

			'should handle promises on the args array': function(done) {
				function async(x, y, cb) {
					cb(null, x + y);
				}

				var promise = nodefn.apply(async, [when(10), 20]);
				promise.then(function(value) {
					assert.equals(value, 30);
				}).ensure(done);
			}
		},

		'call': {
			'should return promise': function() {
				var result = nodefn.call(function() {});
				assertIsPromise(result);
			},

			'the returned promise': {
				'should be resolved with the 2nd arg to the callback': function(done) {
					function async(cb) {
						cb(null, 10);
					}

					var promise = nodefn.call(async);
					promise.then(function(value) {
						assert.equals(value, 10);
					}, fail).ensure(done);
				},

				'should be rejected with the 1st arg to the callback': function(done) {
					var error = new Error('foobar');
					function async(cb) {
						cb(error);
					}

					var promise = nodefn.call(async);
					promise.then(fail, function(reason) {
						assert.same(reason, error);
					}).ensure(done);
				},

				'should be resolved to an array for multi-arg callbacks': function(done) {
					function async(cb) {
						cb(null, 10, 20, 30);
					}

					var promise = nodefn.call(async);
					promise.then(function(values) {
						assert.equals(values, [10, 20, 30]);
					}).ensure(done);
				}
			},

			'should forward extra arguments to the function': function(done) {
				function async(x, y, cb) {
					cb(null, x + y);
				}

				var promise = nodefn.call(async, 10, 20);
				promise.then(function(value) {
					assert.equals(value, 30);
				}).ensure(done);
			},

			'should handle promises on the args array': function(done) {
				function async(x, y, cb) {
					cb(null, x + y);
				}

				var promise = nodefn.call(async, when(10), 20);
				promise.then(function(value) {
					assert.equals(value, 30);
				}).ensure(done);
			}
		},

		'bind': {
			'should be an alias for lift': function() {
				assert.same(nodefn.bind, nodefn.lift);
			}
		},

		'lift': {
			'should return a function': function() {
				assert.isFunction(nodefn.lift(function() {}));
			},

			'the returned function': {
				'should return a promise': function() {
					var result = nodefn.lift(function() {});
					assertIsPromise(result());
				},

				'should resolve the promise with the callback value': function(done) {
					var result = nodefn.lift(function(callback) {
						callback(null, 10);
					});


					result().then(function(value) {
						assert.equals(value, 10);
					}, fail).ensure(done);
				},

				'should handle promises as arguments': function(done) {
					var result = nodefn.lift(function(x, callback) {
						callback(null, x + 10);
					});

					result(when(10)).then(function(value) {
						assert.equals(value, 20);
					}, fail).ensure(done);
				},

				'should reject the promise with the error argument': function(done) {
					var error = new Error();
					var result = nodefn.lift(function(callback) {
						callback(error);
					});


					result().then(fail, function(reason) {
						assert.same(reason, error);
					}).ensure(done);
				},

				'should resolve the promise to an array for mult-args': function(done) {
					var result = nodefn.lift(function(callback) {
						callback(null, 10, 20, 30);
					});

					result().then(function(values) {
						assert.equals(values, [10, 20, 30]);
					}).ensure(done);
				}
			},

			'should accept leading arguments': function(done) {
				function fancySum(x, y, callback) {
					callback(null, x + y);
				}

				var partiallyApplied = nodefn.lift(fancySum, 5);

				partiallyApplied(10).then(function(value) {
					assert.equals(value, 15);
				}, fail).ensure(done);
			},

			'should accept promises as leading arguments': function(done) {
				function fancySum(x, y, callback) {
					callback(null, x + y);
				}

				var partiallyApplied = nodefn.lift(fancySum, when(5));

				partiallyApplied(10).then(function(value) {
					assert.equals(value, 15);
				}, fail).ensure(done);
			}
		},

		'createCallback': {
			'should return a function': function() {
				var result = nodefn.createCallback();
				assert.isFunction(result);
			},

			'the returned function': {
				'should resolve the resolver when called without errors': function(done) {
					var deferred = when.defer();
					var callback = nodefn.createCallback(deferred.resolver);

					callback(null, 10);

					deferred.promise.then(function(value) {
						assert.equals(value, 10);
					}, fail).ensure(done);
				},

				'should reject the resolver when called with errors': function(done) {
					var deferred = when.defer();
					var callback = nodefn.createCallback(deferred.resolver);

					var error = new Error();

					callback(error);

					deferred.promise.then(fail, function(reason) {
						assert.same(reason, error);
					}).ensure(done);
				},

				'should pass multiple arguments as an array': function(done) {
					var deferred = when.defer();
					var callback = nodefn.createCallback(deferred.resolver);

					callback(null, 10, 20, 30);

					deferred.promise.then(function(value) {
						assert.equals(value, [10, 20, 30]);
					}, fail).ensure(done);
				}
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
