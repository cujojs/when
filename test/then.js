// Test boilerplate
var buster, assert, refute, when;

buster = require('buster');
assert = buster.assert;
refute = buster.refute;

when = require('../when');
// end boilerplate

var defer, undef;

defer = when.defer;

function f() {}

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

	}

	// TODO: more throw tests
	// TODO: all()/some() tests for throw with variadic instead of array. see checkHandlers.html
});