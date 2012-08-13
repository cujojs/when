(function(buster, when) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

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
		'should resolve': function(done) {
			var d = when.defer();

			d.promise.then(
				function(val) {
					assert.equals(val, 1);
				},
				fail
			).always(done());

			d.resolve(1);
		},

		'should resolve with promised value': function(done) {
			var d = when.defer();

			d.promise.then(
				function(val) {
					assert.equals(val, 1);
				},
				fail
			).always(done);

			d.resolve(fakeResolved(1));

		},

		'should reject when resolved with rejected promise': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				function(val) {
					assert.equals(val, 1);
				}
			).always(done);

			d.resolve(fakeRejected(1));
		},

		'should return a promise for the resolution value': function(done) {
			var d = when.defer();

			d.resolve(1).then(
				function(returnedPromiseVal) {
					d.then(function(val) {
						assert.equals(returnedPromiseVal, val);
					});
				},
				fail
			).always(done);
		},

		'should return a promise for a promised resolution value': function(done) {
			var d = when.defer();

			d.resolve(when(1)).then(
				function(returnedPromiseVal) {
					d.then(function(val) {
						assert.equals(returnedPromiseVal, val);
					});
				},
				fail
			).always(done);
		},

		'should return a promise for a promised rejection value': function(done) {
			var d = when.defer();

			// Both the returned promise, and the deferred's own promise should
			// be rejected with the same value
			d.resolve(when.reject(1)).then(
				fail,
				function(returnedPromiseVal) {
					d.then(
						fail,
						function(val) {
							assert.equals(returnedPromiseVal, val);
						}
					);
				}
			).always(done);
		},

		'should invoke newly added callback when already resolved': function(done) {
			var d = when.defer();

			d.resolve(1);

			d.promise.then(
				function(val) {
					assert.equals(val, 1);
					done();
				},
				function() {
					buster.fail();
					done();
				}
			);
		}
	},

	'reject': {
		'should reject': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				function(val) {
					assert.equals(val, 1);
				}
			).always(done);

			d.reject(1);
		},

		'should return a promise for the rejection value': function(done) {
			var d = when.defer();

			// Both the returned promise, and the deferred's own promise should
			// be rejected with the same value
			d.reject(1).then(
				fail,
				function(returnedPromiseVal) {
					d.then(
						fail,
						function(val) {
							assert.equals(returnedPromiseVal, val);
						}
					);
				}
			).always(done);
		},

		'should invoke newly added errback when already rejected': function(done) {
			var d = when.defer();

			d.reject(1);

			d.promise.then(
				function () {
					buster.fail();
					done();
				},
				function (val) {
					assert.equals(val, 1);
					done();
				}
			);
		}
	},

	'progress': {

		'should progress': function(done) {
			var d = when.defer();

			d.promise.then(
				fail,
				fail,
				function(val) {
					assert.equals(val, 1);
					done();
				}
			);

			d.progress(1);
		},

		'should allow resolve after progress': function(done) {
			var d = when.defer();

			var progressed = false;
			d.promise.then(
				function(val) {
					assert(progressed);
					assert.equals(val, 2);
					done();
				},
				function() {
					buster.fail();
					done();
				},
				function(val) {
					assert.equals(val, 1);
					progressed = true;
				}
			);

			d.progress(1);
			d.resolve(2);
		},

		'should allow reject after progress': function(done) {
			var d = when.defer();

			var progressed = false;
			d.promise.then(
				function() {
					buster.fail();
					done();
				},
				function(val) {
					assert(progressed);
					assert.equals(val, 2);
					done();
				},
				function(val) {
					assert.equals(val, 1);
					progressed = true;
				}
			);

			d.progress(1);
			d.reject(2);
		}
	},

	'should return a promise for passed-in resolution value when already resolved': function(done) {
		var d = when.defer();
		d.resolve(1);

		d.resolve(2).then(function(val) {
			assert.equals(val, 2);
		}).always(done);
	},

	'should return a promise for passed-in rejection value when already resolved': function(done) {
		var d = when.defer();
		d.resolve(1);

		d.reject(2).then(
			fail,
			function(val) {
				assert.equals(val, 2);
			}
		).always(done);
	},

	'should return silently on progress when already resolved': function() {
		var d = when.defer();
		d.resolve(1);

		refute.defined(d.progress());
	},

	'should return a promise for passed-in resolution value when already rejected': function(done) {
		var d = when.defer();
		d.reject(1);

		d.resolve(2).then(function(val) {
			assert.equals(val, 2);
		}).always(done);
	},

	'should return a promise for passed-in rejection value when already rejected': function(done) {
		var d = when.defer();
		d.reject(1);

		d.reject(2).then(
			fail,
			function(val) {
				assert.equals(val, 2);
			}
		).always(done);
	},

	'should return silently on progress when already rejected': function() {
		var d = when.defer();
		d.reject(1);

		refute.defined(d.progress());
	}

});

})(
	this.buster || require('buster'),
	this.when   || require('..')
);
