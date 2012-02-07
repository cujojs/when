(function(buster, when) {

var assert = buster.assert;

var defer, undef;

defer = when.defer;

function f() {}

function fail() {
	buster.fail();
	done();
}

buster.testCase('promise.then', {

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
			fail
		).then(
			function(val) {
				assert.equals(val, 2);
				done();
			},
			fail
		);

		d.resolve(1);
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
				done();
			},
			fail
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
			fail
		).then(
			fail,
			function(val) {
				assert.equals(val, 2);
				done();
			}
		);

		d.resolve(1);
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
	}

	// TODO: all()/some() tests for throw with variadic instead of array. see checkHandlers.html
});
})(
	this.buster || require('buster'),
	this.when   || require('../when')
);
