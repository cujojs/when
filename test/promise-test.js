(function(buster, define) {

var assert, refute, fail, isFrozen, sentinel, other, slice, undef;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

sentinel = {};
other = {};

slice = Array.prototype.slice;

// In case of testing in an environment without Object.isFrozen
isFrozen = Object.isFrozen || function() { return true; };

function f() {}

function assertPending(s) {
	assert.equals(s.state, 'pending');
}

function assertFulfilled(s, value) {
	assert.equals(s.state, 'fulfilled');
	assert.same(s.value, value);
}

function assertRejected(s, reason) {
	assert.equals(s.state, 'rejected');
	assert.same(s.reason, reason);
}

define('when/promise-test', function (require) {

	var when, defer;

	when = require('when');
	defer = when.defer;

	buster.testCase('promise', {

		// TODO: Reinstate when v8 Object.freeze() performance is sane
	//	'should be frozen': function() {
	//		assert(isFrozen(defer().promise));
	//	},

		'then': {

			'should return a promise': function() {
				assert.isFunction(defer().promise.then().then);
			},

			'should allow a single callback function': function() {
				assert.isFunction(defer().promise.then(f).then);
			},

			'should allow a callback and errback function': function() {
				assert.isFunction(defer().promise.then(f, f).then);
			},

			'should allow a callback, errback, and progback function': function() {
				assert.isFunction(defer().promise.then(f, f, f).then);
			},

			'should allow null and undefined': function() {
				assert.isFunction(defer().promise.then().then);

				assert.isFunction(defer().promise.then(null).then);
				assert.isFunction(defer().promise.then(null, null).then);
				assert.isFunction(defer().promise.then(null, null, null).then);

				assert.isFunction(defer().promise.then(undef).then);
				assert.isFunction(defer().promise.then(undef, undef).then);
				assert.isFunction(defer().promise.then(undef, undef, undef).then);
			},

			'should allow functions and null or undefined to be mixed': function() {
				assert.isFunction(defer().promise.then(f, null).then);
				assert.isFunction(defer().promise.then(f, null, null).then);
				assert.isFunction(defer().promise.then(null, f).then);
				assert.isFunction(defer().promise.then(null, f, null).then);
				assert.isFunction(defer().promise.then(null, null, f).then);
			},

			'should ignore non-functions': {
				'when fulfillment handler': {
					'is empty string': function(done) {
						when.resolve(true).then('').then(assert, fail).ensure(done);
					},
					'is false': function(done) {
						when.resolve(true).then(false).then(assert, fail).ensure(done);
					},
					'is true': function(done) {
						when.resolve(true).then(true).then(assert, fail).ensure(done);
					},
					'is object': function(done) {
						when.resolve(true).then({}).then(assert, fail).ensure(done);
					},
					'is falsey': function(done) {
						when.resolve(true).then(0).then(assert, fail).ensure(done);
					},
					'is truthy': function(done) {
						when.resolve(true).then(1).then(assert, fail).ensure(done);
					}
				},

				'when rejection handler': {
					'is empty string': function(done) {
						when.reject(true).then(null, '').then(fail, assert).ensure(done);
					},
					'is false': function(done) {
						when.reject(true).then(null, false).then(fail, assert).ensure(done);
					},
					'is true': function(done) {
						when.reject(true).then(null, true).then(fail, assert).ensure(done);
					},
					'is object': function(done) {
						when.reject(true).then(null, {}).then(fail, assert).ensure(done);
					},
					'is falsey': function(done) {
						when.reject(true).then(null, 0).then(fail, assert).ensure(done);
					},
					'is truthy': function(done) {
						when.reject(true).then(null, 1).then(fail, assert).ensure(done);
					}
				},

				'when progress handler': {
					'is empty string': function(done) {
						var d = when.defer();
						d.promise.then(null, null, '').then(fail, fail, assert).then(null, null, done);
						d.notify(true);
					},
					'is false': function(done) {
						var d = when.defer();
						d.promise.then(null, null, false).then(fail, fail, assert).then(null, null, done);
						d.notify(true);
					},
					'is true': function(done) {
						var d = when.defer();
						d.promise.then(null, null, true).then(fail, fail, assert).then(null, null, done);
						d.notify(true);
					},
					'is object': function(done) {
						var d = when.defer();
						d.promise.then(null, null, {}).then(fail, fail, assert).then(null, null, done);
						d.notify(true);
					},
					'is falsey': function(done) {
						var d = when.defer();
						d.promise.then(null, null, 0).then(fail, fail, assert).then(null, null, done);
						d.notify(true);
					},
					'is truthy': function(done) {
						var d = when.defer();
						d.promise.then(null, null, 1).then(fail, fail, assert).then(null, null, done);
						d.notify(true);
					}
				}
			}
		},

		'should preserve object whose valueOf() differs from original object': function(done) {
			var d, expected;

			d = when.defer();
			expected = new Date();

			d.promise.then(
				function(val) {
					assert.same(val, expected);
				},
				fail
			).ensure(done);

			d.resolve(expected);

		},

		'should forward result when callback is null': function(done) {
			var d = when.defer();

			d.promise.then(
				null,
				fail
			).then(
				function(val) {
					assert.equals(val, 1);
				},
				fail
			).ensure(done);

			d.resolve(1);
		},

		'should forward callback result to next callback': function(done) {
			var d = when.defer();

			d.promise.then(
				function(val) {
					return val + 1;
				},
				fail
			).then(
				function(val) {
					assert.equals(val, 2);
				},
				fail
			).ensure(done);

			d.resolve(1);
		},

		'should forward undefined': function(done) {
			var d = when.defer();

			d.promise.then(
				function() {
					// intentionally return undefined
				},
				fail
			).then(
				function(val) {
					refute.defined(val);
				},
				fail
			).ensure(done);

			d.resolve(1);
		},

		'should forward undefined rejection value': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				function() {
					// presence of rejection handler is enough to switch back
					// to resolve mode, even though it returns undefined.
					// The ONLY way to propagate a rejection is to re-throw or
					// return a rejected promise;
				}
			).then(
				function(val) {
					refute.defined(val);
				},
				fail
			).ensure(done);

			d.reject(1);
		},

		'should forward promised callback result value to next callback': function(done) {
			var d = when.defer();

			d.promise.then(
				function(val) {
					var d = when.defer();
					d.resolve(val + 1);
					return d.promise;
				},
				fail
			).then(
				function(val) {
					assert.equals(val, 2);
				},
				fail
			).ensure(done);

			d.resolve(1);
		},

		'should switch from callbacks to errbacks when callback returns a rejection': function(done) {
			var d = when.defer();

			d.promise.then(
				function(val) {
					var d = when.defer();
					d.reject(val + 1);
					return d.promise;
				},
				fail
			).then(
				fail,
				function(val) {
					assert.equals(val, 2);
				}
			).ensure(done);

			d.resolve(1);
		},

		'when an exception is thrown': {

			'a resolved promise': {

				'should reject if the exception is a value': function(done) {
					var d = when.defer();

					d.promise.then(
						function() {
							throw sentinel;
						},
						fail
					).then(
						fail,
						function(val) {
							assert.same(val, sentinel);
						}
					).ensure(done);

					d.resolve();
				},

				'should reject if the exception is a resolved promise': function(done) {
					var d, expected;

					d = when.defer();
					expected = when.resolve();

					d.promise.then(
						function() {
							throw expected;
						},
						fail
					).then(
						fail,
						function(val) {
							assert.same(val, expected);
						}
					).ensure(done);

					d.resolve();
				},

				'should reject if the exception is a rejected promise': function(done) {
					var d, expected;

					d = when.defer();
					expected = when.reject();

					d.promise.then(
						function() {
							throw expected;
						},
						fail
					).then(
						fail,
						function(val) {
							assert.same(val, expected);
						}
					).ensure(done);

					d.resolve();
				}

			},

			'a rejected promise': {

				'should reject if the exception is a value': function(done) {
					var d = when.defer();

					d.promise.then(
						null,
						function() {
							throw sentinel;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, sentinel);
						}
					).ensure(done);

					d.reject();
				},

				'should reject if the exception is a resolved promise': function(done) {
					var d, expected;

					d = when.defer();
					expected = when.resolve();

					d.promise.then(
						null,
						function() {
							throw expected;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, expected);
						}
					).ensure(done);

					d.reject();
				},

				'should reject if the exception is a rejected promise': function(done) {
					var d, expected;

					d = when.defer();
					expected = when.reject();

					d.promise.then(
						null,
						function() {
							throw expected;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, expected);
						}
					).ensure(done);

					d.reject();
				}

			}
		},

		'should switch from errbacks to callbacks when errback does not explicitly propagate': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				function(val) {
					return val + 1;
				}
			).then(
				function(val) {
					assert.equals(val, 2);
				},
				fail
			).ensure(done);

			d.reject(1);
		},

		'should switch from errbacks to callbacks when errback returns a resolution': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				function(val) {
					var d = when.defer();
					d.resolve(val + 1);
					return d.promise;
				}
			).then(
				function(val) {
					assert.equals(val, 2);
				},
				fail
			).ensure(done);

			d.reject(1);
		},

		'should propagate rejections when errback returns a rejection': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				function(val) {
					var d = when.defer();
					d.reject(val + 1);
					return d.promise;
				}
			).then(
				fail,
				function(val) {
					assert.equals(val, 2);
				}
			).ensure(done);

			d.reject(1);
		},

		'should call progback': function(done) {
			var expected, d;

			expected = {};
			d = when.defer();

			d.promise.then(null, null, function (status) {
				assert.same(status, expected);
				done();
			});

			d.notify(expected);
		},

		'always': {
			'should return a promise': function() {
				assert.isFunction(defer().promise.always().then);
			},

			'should register callback': function(done) {
				var d = when.defer();

				d.promise.always(
					function(val) {
						assert.equals(val, 1);
						done();
					}
				);

				d.resolve(1);
			},

			'should register errback': function(done) {
				var d = when.defer();

				d.promise.always(
					function(val) {
						assert.equals(val, 1);
						done();
					}
				);

				d.reject(1);
			},

			'should register progback': function(done) {
				var d = when.defer();

				d.promise.always(null, function (status) {
					assert.equals(status, 1);
					done();
				});

				d.notify(1);
			}

		},

		'ensure': {
			'should return a promise': function() {
				assert.isFunction(defer().promise.ensure().then);
			},

			'when fulfilled': {
				'should call callback': function(done) {
					var d = when.defer();

					d.promise.ensure(
						function() {
							assert.equals(arguments.length, 0);
							done();
						}
					);

					d.resolve(sentinel);
				},

				'should ignore callback return value': function(done) {
					var d = when.defer();

					d.promise.ensure(
						function() {
							return other;
						}
					).then(
						function(val) {
							assert.same(val, sentinel);
						},
						fail
					).ensure(done);

					d.resolve(sentinel);
				},

				'should propagate rejection on throw': function(done) {
					var d = when.defer();

					d.promise.ensure(
						function() {
							throw sentinel;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, sentinel);
						}
					).ensure(done);

					d.resolve(other);
				}
			},

			'when rejected': {
				'should call callback': function(done) {
					var d = when.defer();

					d.promise.ensure(
						function() {
							assert.equals(arguments.length, 0);
							done();
						}
					);

					d.reject(sentinel);
				},

				'should propagate rejection, ignoring callback return value': function(done) {
					var d = when.defer();

					d.promise.ensure(
						function() {
							return other;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, sentinel);
						}
					).ensure(done);

					d.reject(sentinel);
				},

				'should propagate rejection on throw': function(done) {
					var d = when.defer();

					d.promise.ensure(
						function() {
							throw sentinel;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, sentinel);
						}
					).ensure(done);

					d.reject(other);
				}
			}
		},

		'otherwise': {
			'should return a promise': function() {
				assert.isFunction(defer().promise.otherwise().then);
			},

			'should register errback': function(done) {
				var d = when.defer();

				d.promise.otherwise(
					function(val) {
						assert.equals(val, 1);
						done();
					}
				);

				d.reject(1);
			}
		},

		'yield': {
			'should return a promise': function() {
				assert.isFunction(defer().promise.yield().then);
			},

			'should fulfill with the supplied value': function(done) {
				when.resolve(other).yield(sentinel).then(
					function(value) { assert.same(value, sentinel); }
				).ensure(done);
			},

			'should fulfill with the value of a fulfilled promise': function(done) {
				when.resolve(other).yield(when.resolve(sentinel)).then(
					function(value) { assert.same(value, sentinel); }
				).ensure(done);
			},

			'should reject with the reason of a rejected promise': function(done) {
				when.resolve(other).yield(when.reject(sentinel)).then(
					fail,
					function(reason) { assert.same(reason, sentinel); }
				).ensure(done);
			}
		},

		'spread': {
			'should return a promise': function() {
				assert.isFunction(defer().promise.spread().then);
			},

			'should apply onFulfilled with array as argument list': function(done) {
				var expected = [1, 2, 3];
				when.resolve(expected).spread(function() {
					assert.equals(slice.call(arguments), expected);
				}).ensure(done);
			},

			'should resolve array contents': function(done) {
				var expected = [when.resolve(1), 2, when.resolve(3)];
				when.resolve(expected).spread(function() {
					assert.equals(slice.call(arguments), [1, 2, 3]);
				}).ensure(done);
			},

			'should reject if any item in array rejects': function(done) {
				var expected = [when.resolve(1), 2, when.reject(3)];
				when.resolve(expected)
					.spread(fail)
					.then(
						fail,
						function() {
							assert(true);
						}
					).ensure(done);
			},

			'when input is a promise': {
				'should apply onFulfilled with array as argument list': function(done) {
					var expected = [1, 2, 3];
					when.resolve(when.resolve(expected)).spread(function() {
						assert.equals(slice.call(arguments), expected);
					}).ensure(done);
				},

				'should resolve array contents': function(done) {
					var expected = [when.resolve(1), 2, when.resolve(3)];
					when.resolve(when.resolve(expected)).spread(function() {
						assert.equals(slice.call(arguments), [1, 2, 3]);
					}).ensure(done);
				},

				'should reject if input is a rejected promise': function(done) {
					var expected = when.reject([1, 2, 3]);
					when.resolve(expected)
						.spread(fail)
						.then(
						fail,
						function() {
							assert(true);
						}
					).ensure(done);
				}
			}
		},

		'inspect': {

			'when inspecting promises': {
				'should return pending state for pending promise': function() {
					var promise = when.promise(function() {});

					assertPending(promise.inspect());
				},

				'should return fulfilled state for fulfilled promise': function() {
					var promise = when.resolve(sentinel);

					return promise.then(function() {
						assertFulfilled(promise.inspect(), sentinel);
					});
				},

				'should return rejected state for rejected promise': function() {
					var promise = when.reject(sentinel);

					return promise.then(fail, function() {
						assertRejected(promise.inspect(), sentinel);
					});
				}
			},

			'when inspecting thenables': {
				'should return pending state for pending thenable': function() {
					var p = when({ then: function() {} });

					assertPending(p.inspect());
				},

				'should return fulfilled state for fulfilled thenable': function() {
					var p = when({ then: function(fulfill) { fulfill(sentinel); } });

					return p.then(function() {
						assertFulfilled(p.inspect(), sentinel);
					});
				},

				'should return rejected state for rejected thenable': function() {
					var p = when({ then: function(_, rejected) { rejected(sentinel); } });

					return p.then(fail, function() {
						assertRejected(p.inspect(), sentinel);
					});
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
