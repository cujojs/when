(function(buster, define) {
var assert, fail, sentinel, other;

assert = buster.assert;
fail   = buster.fail;
sentinel = { value: 'sentinel' };
other = { value: 'other' };

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
						cb(null, sentinel);
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

				var promise = nodefn.apply(async, [10, 20]);
				return promise.then(function(value) {
					assert.equals(value, 30);
				});
			},

			'should handle promises on the args array': function() {
				function async(x, y, cb) {
					cb(null, x + y);
				}

				var promise = nodefn.apply(async, [when(10), 20]);
				return promise.then(function(value) {
					assert.equals(value, 30);
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

				var promise = nodefn.call(async, 10, 20);
				return promise.then(function(value) {
					assert.equals(value, 30);
				});
			},

			'should handle promises on the args array': function() {
				function async(x, y, cb) {
					cb(null, x + y);
				}

				var promise = nodefn.call(async, when(10), 20);
				return promise.then(function(value) {
					assert.equals(value, 30);
				});
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
				function fancySum(x, y, callback) {
					callback(null, x + y);
				}

				var partiallyApplied = nodefn.lift(fancySum, 5);

				return partiallyApplied(10).then(function(value) {
					assert.equals(value, 15);
				}, fail);
			},

			'should accept promises as leading arguments': function() {
				function fancySum(x, y, callback) {
					callback(null, x + y);
				}

				var partiallyApplied = nodefn.lift(fancySum, when(5));

				return partiallyApplied(10).then(function(value) {
					assert.equals(value, 15);
				});
			}
		},

		'createCallback': {
			'should return a function': function() {
				assert.isFunction(nodefn.createCallback());
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

				'should reject the resolver when called with errors': function() {
					var deferred = when.defer();
					var callback = nodefn.createCallback(deferred.resolver);

					callback(sentinel);

					return deferred.promise.then(fail, function(reason) {
						assert.same(reason, sentinel);
					});
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
				assert.isFunction(nodefn.bindCallback({}, function(){}).then);
			},

			'should register callback as callback': function () {
				function callback(_, val) {
					assert.same(val, sentinel);
				}

				return nodefn.bindCallback(
					when.resolve(sentinel),
					callback
				);
			},

			'should register callback as errback': function () {
				function callback(err) {
					assert.same(err, sentinel);
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
				'should be fulfilled with the callback return value': {
					'when the original is fulfilled': function () {
						function callback(_, val) {
							assert.same(val, other);
							return sentinel;
						}

						return nodefn.bindCallback(
							when.resolve(other),
							callback
						).then(function (value) {
							assert.same(value, sentinel);
						});
					},

					'when the original is rejected': function () {
						function callback(err) {
							assert.same(err, other);
							return sentinel;
						}

						return nodefn.bindCallback(
							when.reject(other),
							callback
						).then(function (value) {
							assert.same(value, sentinel);
						});
					}
				},

				'should be rejected with any error thrown in the callback': {
					'when the original is fulfilled': function () {
						function callback(_, val) {
							assert.same(val, other);
							throw sentinel;
						}

						return nodefn.bindCallback(
							when.resolve(other),
							callback
						).then(fail, function (reason) {
							assert.same(reason, sentinel);
						});
					},

					'when the original is rejected': function () {
						function callback(err) {
							assert.same(err, other);
							throw sentinel;
						}

						return nodefn.bindCallback(
							when.reject(other),
							callback
						).then(fail, function (reason) {
							assert.same(reason, sentinel);
						});
					}
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

					assert.isFunction(lifted({}).then);
				},

				'should register callback as callback': function () {
					function callback(_, val) {
						assert.same(val, sentinel);
					}

					var lifted = nodefn.liftCallback(callback);

					return lifted(when.resolve(sentinel));
				},

				'should register callback as errback': function () {
					function callback(err) {
						assert.same(err, sentinel);
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
					'should be fulfilled with the callback return value': {
						'when the original is fulfilled': function () {
							function callback(_, val) {
								assert.same(val, other);
								return sentinel;
							}

							var lifted = nodefn.liftCallback(callback);

							return lifted(when.resolve(other)).then(function (value) {
								assert.same(value, sentinel);
							});
						},

						'when the original is rejected': function () {
							function callback(err) {
								assert.same(err, other);
								return sentinel;
							}

							var lifted = nodefn.liftCallback(callback);

							return lifted(when.reject(other)).then(function (value) {
								assert.same(value, sentinel);
							});
						}
					},

					'should be rejected with any error thrown in the callback': {
						'when the original is fulfilled': function () {
							function callback(_, val) {
								assert.same(val, other);
								throw sentinel;
							}

							var lifted = nodefn.liftCallback(callback);

							return lifted(when.resolve(other)).then(fail, function (reason) {
								assert.same(reason, sentinel);
							});
						},

						'when the original is rejected': function () {
							function callback(err) {
								assert.same(err, other);
								throw sentinel;
							}

							var lifted = nodefn.liftCallback(callback);

							return lifted(when.reject(other)).then(fail, function (reason) {
								assert.same(reason, sentinel);
							});
						}
					}
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
