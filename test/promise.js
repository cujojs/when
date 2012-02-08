(function(buster, when) {

var assert = buster.assert;

var defer, isFrozen, undef;

defer = when.defer;

function f() {}

function fail(done) {
	return function() {
		buster.fail();
		done();
	};
}

// In case of testing in an environment without Object.isFrozen
isFrozen = Object.isFrozen || function() { return true; };

buster.testCase('promise', {

	'should be frozen': function() {
		assert(Object.isFrozen(defer().promise));
	},

	'should allow a single callback function': function() {
		assert.typeOf(defer().promise.then(f).then, 'function');
	},

	'should allow a callback and errback function': function() {
		assert.typeOf(defer().promise.then(f, f).then, 'function');
	},

	'should allow a callback, errback, and progback function': function() {
		assert.typeOf(defer().promise.then(f, f, f).then, 'function');
	},

	'should allow null and undefined': function() {
		assert.typeOf(defer().promise.then().then, 'function');

		assert.typeOf(defer().promise.then(null).then, 'function');
		assert.typeOf(defer().promise.then(null, null).then, 'function');
		assert.typeOf(defer().promise.then(null, null, null).then, 'function');

		assert.typeOf(defer().promise.then(undef).then, 'function');
		assert.typeOf(defer().promise.then(undef, undef).then, 'function');
		assert.typeOf(defer().promise.then(undef, undef, undef).then, 'function');
	},

	'should allow functions and null or undefined to be mixed': function() {
		assert.typeOf(defer().promise.then(f, null).then, 'function');
		assert.typeOf(defer().promise.then(f, null, null).then, 'function');
		assert.typeOf(defer().promise.then(null, f).then, 'function');
		assert.typeOf(defer().promise.then(null, f, null).then, 'function');
		assert.typeOf(defer().promise.then(null, null, f).then, 'function');
	},

	'should throw if non-function arguments are provided': function() {
		assert.exception(function() { defer().promise.then(1); });
		assert.exception(function() { defer().promise.then(1, null); });
		assert.exception(function() { defer().promise.then(1, null, null); });
		assert.exception(function() { defer().promise.then(null, 1); });
		assert.exception(function() { defer().promise.then(null, 1, null); });
		assert.exception(function() { defer().promise.then(null, null, 1); });

	},

	'should forward callback result to next callback': function(done) {
		var d = when.defer();

		d.promise.then(
			function(val) {
				return val + 1;
			},
			fail(done)
		).then(
			function(val) {
				assert.equals(val, 2);
				done();
			},
			fail(done)
		);

		d.resolve(1);
	},

	'should forward previous result instead of undefined': function(done) {
		var d = when.defer();

		d.promise.then(
			function() {
				// intentionally return undefined
			},
			fail(done)
		).then(
			function(val) {
				assert.equals(val, 1);
				done();
			},
			fail(done)
		);

		d.resolve(1);
	},

	'should forward previous rejection value instead of undefined': function(done) {
		var d = when.defer();

		d.promise.then(
			fail(done),
			function() {
				// presence of rejection handler is enough to switch back
				// to resolve mode, even though it returns undefined.
				// The ONLY way to propagate a rejection is to re-throw or
				// return a rejected promise;
			}
		).then(
			function(val) {
				assert.equals(val, 1);
				done();
			},
			fail(done)
		);

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
			fail(done)
		).then(
			function(val) {
				assert.equals(val, 2);
				done();
			},
			fail(done)
		);

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
			fail(done)
		).then(
			fail(done),
			function(val) {
				assert.equals(val, 2);
				done();
			}
		);

		d.resolve(1);
	},

	'should switch from callbacks to errbacks when callback throws': function(done) {
		var d = when.defer();

		d.promise.then(
			function(val) {
				throw val + 1;
			},
			fail(done)
		).then(
			fail(done),
			function(val) {
				assert.equals(val, 2);
				done();
			}
		);

		d.resolve(1);
	},

	'should switch from errbacks to callbacks when errback does not explicitly propagate': function(done) {
		var d = when.defer();

		d.promise.then(
			fail(done),
			function(val) {
				return val + 1;
			}
		).then(
			function(val) {
				assert.equals(val, 2);
				done();
			},
			fail(done)
		);

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
				done();
			},
			fail
		);

		d.reject(1);
	},

	'should propagate rejections when errback throws': function(done) {
		var d = when.defer();

		d.promise.then(
			fail(done),
			function(val) {
				throw val + 1;
			}
		).then(
			fail(done),
			function(val) {
				assert.equals(val, 2);
				done();
			}
		);

		d.reject(1);
	},

	'should propagate rejections when errback returns a rejection': function(done) {
		var d = when.defer();

		d.promise.then(
			fail(done),
			function(val) {
				var d = when.defer();
				d.reject(val + 1);
				return d.promise;
			}
		).then(
			function() {
				buster.fail();
				done();
			},
			function(val) {
				assert.equals(val, 2);
				done();
			}
		);

		d.reject(1);
	},

});
})(
	this.buster || require('buster'),
	this.when   || require('../when')
);
