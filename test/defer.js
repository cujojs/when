(function(buster, when) {

var assert, refute, fail, sentinel, other;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

sentinel = {};
other = {};

function fakeResolved(val) {
	return {
		then: function(callback) {
			return fakeResolved(callback ? callback(val) : val);
		}
	};
}

function fakeRejected(reason) {
	return {
		then: function(callback, errback) {
			return errback ? fakeResolved(errback(reason)) : fakeRejected(reason);
		}
	};
}

buster.testCase('when.defer', {

	'resolve': {
		'should fulfill with an immediate value': function(done) {
			var d = when.defer();

			d.promise.then(
				function(val) {
					assert.same(val, sentinel);
				},
				fail
			).always(done);

			d.resolve(sentinel);
		},

		'should fulfill with fulfilled promised': function(done) {
			var d = when.defer();

			d.promise.then(
				function(val) {
					assert.same(val, sentinel);
				},
				fail
			).always(done);

			d.resolve(fakeResolved(sentinel));
		},

		'should reject with rejected promise': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			).always(done);

			d.resolve(fakeRejected(sentinel));
		},

		'should return a promise for the resolution value': function(done) {
			var d = when.defer();

			d.resolve(sentinel).then(
				function(returnedPromiseVal) {
					d.promise.then(function(val) {
						assert.same(returnedPromiseVal, val);
					});
				},
				fail
			).always(done);
		},

		'should return a promise for a promised resolution value': function(done) {
			var d = when.defer();

			d.resolve(when.resolve(sentinel)).then(
				function(returnedPromiseVal) {
					d.promise.then(function(val) {
						assert.same(returnedPromiseVal, val);
					});
				},
				fail
			).always(done);
		},

		'should return a promise for a promised rejection value': function(done) {
			var d = when.defer();

			// Both the returned promise, and the deferred's own promise should
			// be rejected with the same value
			d.resolve(when.reject(sentinel)).then(
				fail,
				function(returnedPromiseVal) {
					d.promise.then(
						fail,
						function(val) {
							assert.same(returnedPromiseVal, val);
						}
					);
				}
			).always(done);
		},

		'should invoke newly added callback when already resolved': function(done) {
			var d = when.defer();

			d.resolve(sentinel);

			d.promise.then(
				function(val) {
					assert.same(val, sentinel);
					done();
				},
				fail
			).always(done);
		}
	},

	'reject': {
		'should reject': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			).always(done);

			d.reject(sentinel);
		},

		'should return a promise for the rejection value': function(done) {
			var d = when.defer();

			// Both the returned promise, and the deferred's own promise should
			// be rejected with the same value
			d.reject(sentinel).then(
				fail,
				function(returnedPromiseVal) {
					d.promise.then(
						fail,
						function(val) {
							assert.same(returnedPromiseVal, val);
						}
					);
				}
			).always(done);
		},

		'should invoke newly added errback when already rejected': function(done) {
			var d = when.defer();

			d.reject(sentinel);

			d.promise.then(
				fail,
				function (val) {
					assert.equals(val, sentinel);
				}
			).always(done);
		}
	},

	'progress': {

		'should progress': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				fail,
				function(val) {
					assert.same(val, sentinel);
					done();
				}
			);

			d.progress(sentinel);
		},

		'should propagate progress to downstream promises': function(done) {
			var d = when.defer();

			d.promise
			.then(fail, fail,
				function(update) {
					return update;
				}
			)
			.then(fail, fail,
				function(update) {
					assert.same(update, sentinel);
					done();
				}
			);

			d.progress(sentinel);
		},

		'should propagate transformed progress to downstream promises': function(done) {
			var d = when.defer();

			d.promise
			.then(fail, fail,
				function() {
					return sentinel;
				}
			)
			.then(fail, fail,
				function(update) {
					assert.same(update, sentinel);
					done();
				}
			);

			d.progress(other);
		},

		'should propagate caught exception value as progress': function(done) {
			var d = when.defer();

			d.promise
			.then(fail, fail,
				function() {
					throw sentinel;
				}
			)
			.then(fail, fail,
				function(update) {
					assert.same(update, sentinel);
					done();
				}
			);

			d.progress(other);
		},

		'should forward progress events when intermediary callback (tied to a resolved promise) returns a promise': function(done) {
			var d, d2;

			d = when.defer();
			d2 = when.defer();

			// resolve d BEFORE calling attaching progress handler
			d.resolve();

			d.promise.then(
				function() {
					return d2.promise;
				}
			).then(fail, fail,
				function(update) {
					assert.same(update, sentinel);
					done();
				}
			);

			d2.progress(sentinel);
		},

		'should forward progress events when intermediary callback (tied to an unresovled promise) returns a promise': function(done) {
			var d, d2;

			d = when.defer();
			d2 = when.defer();

			d.promise.then(
				function() {
					return d2.promise;
				}
			).then(fail, fail,
				function(update) {
					assert.same(update, sentinel);
					done();
				}
			);

			// resolve d AFTER calling attaching progress handler
			d.resolve();
			d2.progress(sentinel);
		},

		'should forward progress when resolved with another promise': function(done) {
			var d, d2;

			d = when.defer();
			d2 = when.defer();

			d.promise
			.then(fail, fail,
				function() {
					return sentinel;
				}
			)
			.then(fail, fail,
				function(update) {
					assert.same(update, sentinel);
					done();
				}
			);

			d.resolve(d2.promise);

			d2.progress();
		},

		'should allow resolve after progress': function(done) {
			var d = when.defer();

			var progressed = false;
			d.promise.then(
				function() {
					assert(progressed);
					done();
				},
				fail,
				function() {
					progressed = true;
				}
			);

			d.progress();
			d.resolve();
		},

		'should allow reject after progress': function(done) {
			var d = when.defer();

			var progressed = false;
			d.promise.then(
				fail,
				function() {
					assert(progressed);
					done();
				},
				function() {
					progressed = true;
				}
			);

			d.progress();
			d.reject();
		}
	},

	'should return a promise for passed-in resolution value when already resolved': function(done) {
		var d = when.defer();
		d.resolve(other);

		d.resolve(sentinel).then(function(val) {
			assert.same(val, sentinel);
		}).always(done);
	},

	'should return a promise for passed-in rejection value when already resolved': function(done) {
		var d = when.defer();
		d.resolve(other);

		d.reject(sentinel).then(
			fail,
			function(val) {
				assert.same(val, sentinel);
			}
		).always(done);
	},

	'should return silently on progress when already resolved': function() {
		var d = when.defer();
		d.resolve();

		refute.defined(d.progress());
	},

	'should return a promise for passed-in resolution value when already rejected': function(done) {
		var d = when.defer();
		d.reject(other);

		d.resolve(sentinel).then(function(val) {
			assert.same(val, sentinel);
		}).always(done);
	},

	'should return a promise for passed-in rejection value when already rejected': function(done) {
		var d = when.defer();
		d.reject(other);

		d.reject(sentinel).then(
			fail,
			function(val) {
				assert.same(val, sentinel);
			}
		).always(done);
	},

	'should return silently on progress when already rejected': function() {
		var d = when.defer();
		d.reject();

		refute.defined(d.progress());
	}

});

})(
	this.buster || require('buster'),
	this.when   || require('..')
);
