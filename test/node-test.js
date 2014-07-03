var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var refute = buster.refute;
var fail = buster.referee.fail;

var when = require('../when');
var nodefn = require('../node');

var sentinel = { value: 'sentinel' };
var other = { value: 'other' };

function assertIsPromise(something) {
	var message = 'Object is not a promise';
	buster.assert(when.isPromiseLike(something), message);
}

buster.testCase('when/node', {
	'apply': {
		'should return promise': function() {
			assertIsPromise(nodefn.apply(function() {}));
		},

		'should preserve thisArg': function() {
			return nodefn.apply.call(sentinel, function(cb) {
				assert.same(this, sentinel);
				cb(null);
			});
		},

		'the returned promise': {
			'should be resolved with the 2nd arg to the callback': function() {
				function async(cb) {
					setTimeout(function() {
						cb(null, sentinel);
					}, 100);
				}

				var promise = nodefn.apply(async);
				return promise.then(function(value) {
					assert.same(value, sentinel);
				});
			},

			'should be rejected with the 1st arg to the callback': function() {
				function async(cb) {
					cb(other);
				}

				var promise = nodefn.apply(async);
				return promise.then(fail, function(reason) {
					assert.same(reason, other);
				});
			},

			'should be resolved to an array for multi-arg callbacks': function() {
				function async(cb) {
					cb(null, 10, 20, 30);
				}

				var promise = nodefn.apply(async);
				return promise.then(function(values) {
					assert.equals(values, [10, 20, 30]);
				});
			}
		},

		'should forward an array of args to the function': function() {
			function async(x, y, cb) {
				cb(null, x + y);
			}

			var promise = nodefn.apply(async, ['a', 'b']);
			return promise.then(function(value) {
				assert.equals(value, 'ab');
			});
		},

		'should handle promises on the args array': function() {
			function async(x, y, cb) {
				cb(null, x + y);
			}

			var promise = nodefn.apply(async, [when('a'), 'b']);
			return promise.then(function(value) {
				assert.equals(value, 'ab');
			});
		}
	},

	'call': {
		'should return promise': function() {
			assertIsPromise(nodefn.call(function() {}));
		},

		'should preserve thisArg': function() {
			return nodefn.call.call(sentinel, function(cb) {
				assert.same(this, sentinel);
				cb(null);
			});
		},

		'the returned promise': {
			'should be resolved with the 2nd arg to the callback': function() {
				function async(cb) {
					cb(null, sentinel);
				}

				var promise = nodefn.call(async);
				return promise.then(function(value) {
					assert.same(value, sentinel);
				});
			},

			'should be rejected with the 1st arg to the callback': function() {
				function async(cb) {
					cb(sentinel);
				}

				var promise = nodefn.call(async);
				return promise.then(fail, function(reason) {
					assert.same(reason, sentinel);
				});
			},

			'should be resolved to an array for multi-arg callbacks': function() {
				function async(cb) {
					cb(null, 10, 20, 30);
				}

				var promise = nodefn.call(async);
				return promise.then(function(values) {
					assert.equals(values, [10, 20, 30]);
				});
			}
		},

		'should forward extra arguments to the function': function() {
			function async(x, y, cb) {
				cb(null, x + y);
			}

			var promise = nodefn.call(async, 'a', 'b');
			return promise.then(function(value) {
				assert.equals(value, 'ab');
			});
		},

		'should handle promises on the args array': function() {
			function async(x, y, cb) {
				cb(null, x + y);
			}

			var promise = nodefn.call(async, when('a'), 'b');
			return promise.then(function(value) {
				assert.equals(value, 'ab');
			});
		}
	},

	'lift': {
		'should return a function': function() {
			assert.isFunction(nodefn.lift(function() {}));
		},

		'should preserve thisArg': function() {
			return nodefn.lift(function(cb) {
				assert.same(this, sentinel);
				cb(null);
			}).call(sentinel);
		},

		'the returned function': {
			'should return a promise': function() {
				var result = nodefn.lift(function() {});
				assertIsPromise(result());
			},

			'should resolve the promise with the callback value': function() {
				var result = nodefn.lift(function(callback) {
					callback(null, sentinel);
				});


				return result().then(function(value) {
					assert.same(value, sentinel);
				});
			},

			'should handle promises as arguments': function() {
				var result = nodefn.lift(function(x, callback) {
					callback(null, x);
				});

				return result(when(sentinel)).then(function(value) {
					assert.same(value, sentinel);
				});
			},

			'should reject the promise with the error argument': function() {
				var result = nodefn.lift(function(callback) {
					callback(sentinel);
				});


				return result().then(fail, function(reason) {
					assert.same(reason, sentinel);
				});
			},

			'should resolve the promise to an array for mult-args': function() {
				var result = nodefn.lift(function(callback) {
					callback(null, 10, 20, 30);
				});

				return result().then(function(values) {
					assert.equals(values, [10, 20, 30]);
				});
			}
		},

		'should accept leading arguments': function() {
			function async(x, y, callback) {
				callback(null, x + y);
			}

			var partiallyApplied = nodefn.lift(async, 'a');

			return partiallyApplied('b').then(function(value) {
				assert.equals(value, 'ab');
			}, fail);
		},

		'should accept promises as leading arguments': function() {
			function async(x, y, callback) {
				callback(null, x + y);
			}

			var partiallyApplied = nodefn.lift(async, when('a'));

			return partiallyApplied('b').then(function(value) {
				assert.equals(value, 'ab');
			});
		}
	},

	'createCallback': {
		'should return a function': function() {
			assert.isFunction(nodefn.createCallback({}));
		},

		'the returned function': {
			'should resolve the resolver when called without errors': function() {
				var deferred = when.defer();
				var callback = nodefn.createCallback(deferred.resolver);

				callback(null, 10);

				return deferred.promise.then(function(value) {
					assert.equals(value, 10);
				}, fail);
			},

			'should reject the resolver when called with errors': function(done) {
				var deferred = when.defer();
				var callback = nodefn.createCallback(deferred.resolver);

				callback(sentinel);

				return deferred.promise.then(fail, function(reason) {
					assert.same(reason, sentinel);
				}).done(done);
			},

			'should pass multiple arguments as an array': function() {
				var deferred = when.defer();
				var callback = nodefn.createCallback(deferred.resolver);

				callback(null, 10, 20, 30);

				return deferred.promise.then(function(value) {
					assert.equals(value, [10, 20, 30]);
				});
			}
		}
	},

	'bindCallback': {
		'should return a promise': function () {
			assert.isFunction(nodefn.bindCallback(when.resolve(true), function(){}).then);
		},

		'should register callback as callback': function (done) {
			function callback(_, val) {
				assert.same(val, sentinel);
				done();
			}

			return nodefn.bindCallback(
				when.resolve(sentinel),
				callback
			);
		},

		'should register callback as errback': function (done) {
			function callback(err) {
				assert.same(err, sentinel);
				done();
			}

			return nodefn.bindCallback(
				when.reject(sentinel),
				callback
			);
		},

		'should handle null values': function () {
			return nodefn.bindCallback(
				when.resolve(sentinel),
				null
			).then(function (value) {
				assert.same(value, sentinel);
			});
		},

		'returned promise': {
			'should be fulfilled with the original value': function (done) {
				function callback() {
					return other;
				}

				return nodefn.bindCallback(
					when.resolve(sentinel),
					callback
				).then(function (value) {
					assert.same(value, sentinel);
				}).ensure(done);
			},

			'should be rejected with the original error': function (done) {
				function callback() {
					return other;
				}

				return nodefn.bindCallback(
					when.reject(sentinel),
					callback
				).then(fail, function (reason) {
					assert.same(reason, sentinel);
				}).ensure(done);
			},

			'should fire onFulfilled before the callback': function (done) {
				var callbackRan = false;

				function callback() {
					callbackRan = true;
				}

				return nodefn.bindCallback(
					when.resolve(sentinel),
					callback
				).then(function (value) {
					assert.same(value, sentinel);
					refute(callbackRan);
				}).ensure(done);
			},

			'should fire onRejected before the callback': function (done) {
				var callbackRan = false;

				function callback() {
					callbackRan = true;
				}

				return nodefn.bindCallback(
					when.reject(sentinel),
					callback
				).then(fail, function (reason) {
					assert.same(reason, sentinel);
					refute(callbackRan);
				}).ensure(done);
			}
		}
	},

	'liftCallback': {
		'should return a function': function () {
			assert.isFunction(nodefn.liftCallback(function(){}));
		},

		'wrapped callback': {
			'should return a promise': function () {
				var lifted = nodefn.liftCallback(function(){});

				assert.isFunction(lifted(when.resolve(true)).then);
			},

			'should register callback as callback': function (done) {
				function callback(_, val) {
					assert.same(val, sentinel);
					done();
				}

				var lifted = nodefn.liftCallback(callback);

				return lifted(when.resolve(sentinel));
			},

			'should register callback as errback': function (done) {
				function callback(err) {
					assert.same(err, sentinel);
					done();
				}

				var lifted = nodefn.liftCallback(callback);

				return lifted(when.reject(sentinel));
			},

			'should handle null values': function () {
				var lifted = nodefn.liftCallback(null);

				return lifted(when.resolve(sentinel)).then(function (value) {
					assert.same(value, sentinel);
				});
			},

			'returned promise': {
				'should be fulfilled with the original value': function (done) {
					function callback() {
						return other;
					}

					var lifted = nodefn.liftCallback(callback);

					return lifted(when.resolve(sentinel)).then(function (value) {
						assert.same(value, sentinel);
					}).ensure(done);
				},

				'should be rejected with the original error': function (done) {
					function callback() {
						return other;
					}

					var lifted = nodefn.liftCallback(callback);

					return lifted(when.reject(sentinel)).then(fail, function (reason) {
						assert.same(reason, sentinel);
					}).ensure(done);
				},

				'should fire onFulfilled before the callback': function (done) {
					var callbackRan = false;

					function callback() {
						callbackRan = true;
					}

					var lifted = nodefn.liftCallback(callback);

					return lifted(when.resolve(sentinel)).then(function (value) {
						assert.same(value, sentinel);
						refute(callbackRan);
					}).ensure(done);
				},

				'should fire onRejected before the callback': function (done) {
					var callbackRan = false;

					function callback() {
						callbackRan = true;
					}

					var lifted = nodefn.liftCallback(callback);

					return lifted(when.reject(sentinel)).then(fail, function (reason) {
						assert.same(reason, sentinel);
						refute(callbackRan);
					}).ensure(done);
				}
			}
		}
	}
});
