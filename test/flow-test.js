var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var CorePromise = require('../when').Promise;

var sentinel = { value: 'sentinel' };
var other = { value: 'other' };

var origOnUnhandled = CorePromise.onPotentiallyUnhandledRejection;
var origOnHandled = CorePromise.onPotentiallyUnhandledRejectionHandled;

buster.testCase('when/lib/flow', {

	'otherwise': {
		'should be an alias for catch': function() {
			assert.same(CorePromise.prototype['catch'], CorePromise.prototype.otherwise);
		}
	},

	'catch': {
		'should catch rejections': function() {
			return CorePromise.reject(sentinel)['catch'](function(e) {
				assert.same(e, sentinel);
			});
		},

		'when predicate is provided': {

			'and is an Error type match': {
				'should only catch errors of same type': function() {
					var e1 = new TypeError();
					return CorePromise.reject(e1)['catch'](SyntaxError, fail)
						['catch'](TypeError, function(e) {
						assert.same(e1, e);
					});
				}
			},

			'and is a predicate function': {
				'should only catch errors of same type': function() {
					var e1 = new TypeError();
					return CorePromise.reject(e1)['catch'](function(e) {
						return e !== e1;
					}, fail)['catch'](function(e) {
						return e === e1;
					}, function(e) {
						assert.same(e1, e);
					});
				}
			},

			'but is not a function': {
				'when rejected should reject with a TypeError': function() {
					return CorePromise.reject(sentinel)['catch'](123, fail)
						['catch'](function(e) {
							assert(e instanceof TypeError);
						});
				},

				'when fulfilled should reject with a TypeError': function() {
					return CorePromise.resolve(sentinel)['catch'](123, fail)
						['catch'](function(e) {
						assert(e instanceof TypeError);
					});
				}

			}
		}
	},

	'finally': {
		'should be an alias for ensure': function() {
			var p = CorePromise.resolve();
			assert.same(p['finally'], p.ensure);
		}
	},

	'ensure': {
		'should return a promise': function() {
			assert.isFunction(CorePromise.resolve().ensure().then);
		},

		'should not suppress unhandled rejection': {
			tearDown: function() {
				CorePromise.onPotentiallyUnhandledRejection = origOnUnhandled;
				CorePromise.onPotentiallyUnhandledRejectionHandled = origOnHandled;
			},

			'when handler returns non-promise': function(done) {
				CorePromise.onPotentiallyUnhandledRejection = function() {
					assert(true);
					done();
				};

				CorePromise.reject(sentinel).ensure(function() {});
			},

			'when handler returns promise': function(done) {
				CorePromise.onPotentiallyUnhandledRejection = function() {
					assert(true);
					done();
				};

				CorePromise.reject(sentinel).ensure(function() {
					return CorePromise.resolve(other);
				});
			},

			'when finally handler throws': function(done) {
				/*global setTimeout*/
				var errors = {};
				CorePromise.onPotentiallyUnhandledRejection = function(rej) {
					errors[rej.errorId] = rej.value;
				};

				CorePromise.onPotentiallyUnhandledRejectionHandled = function(rej) {
					delete errors[rej.errorId];
				};

				CorePromise.reject(other).ensure(function() {
					throw sentinel;
				});

				setTimeout(done(function() {
					var keys = Object.keys(errors);
					assert.equals(keys.length, 1);
					assert.same(errors[keys[0]], sentinel);
				}), 100);
			},

			'when finally handler rejects': function(done) {
				/*global setTimeout*/
				var errors = {};
				CorePromise.onPotentiallyUnhandledRejection = function(rej) {
					errors[rej.errorId] = rej.value;
				};

				CorePromise.onPotentiallyUnhandledRejectionHandled = function(rej) {
					delete errors[rej.errorId];
				};

				CorePromise.reject(other).ensure(function() {
					return CorePromise.reject(sentinel);
				});

				setTimeout(done(function() {
					var keys = Object.keys(errors);
					assert.equals(keys.length, 1);
					assert.same(errors[keys[0]], sentinel);
				}), 100);
			}
		},

		'when fulfilled': {
			'should ignore callback return value': function() {
				return CorePromise.resolve(sentinel).ensure(
					function() {
						return other;
					}
				).then(
					function(val) {
						assert.same(val, sentinel);
					},
					fail
				);
			},

			'should await returned promise': function() {
				var awaited = false;
				return CorePromise.resolve(sentinel).ensure(function() {
					return new CorePromise(function(resolve) {
						setTimeout(function() {
							awaited = true;
							resolve();
						}, 1);
					});
				}).then(function() {
					assert(awaited);
				});
			},

			'should propagate rejection on throw': function() {
				return CorePromise.resolve(other).ensure(
					function() {
						throw sentinel;
					}
				).then(
					fail,
					function(val) {
						assert.same(val, sentinel);
					}
				);
			}
		},

		'when rejected': {
			'should propagate rejection, ignoring callback return value': function() {
				return CorePromise.reject(sentinel).ensure(
					function() {
						return other;
					}
				).then(
					fail,
					function(val) {
						assert.same(val, sentinel);
					}
				);
			},

			'should await returned promise': function() {
				var awaited = false;
				return CorePromise.resolve(sentinel).ensure(function() {
					return new CorePromise(function(resolve, reject) {
						setTimeout(function() {
							awaited = true;
							reject();
						}, 1);
					});
				})['catch'](function() {
					assert(awaited);
				});
			},

			'should propagate rejection on throw': function() {
				return CorePromise.reject(other).ensure(
					function() {
						throw sentinel;
					}
				).then(
					fail,
					function(val) {
						assert.same(val, sentinel);
					}
				);
			}
		},

		'should ignore non-function': function() {
			return CorePromise.resolve(true).ensure().then(assert);
		}
	}
});
