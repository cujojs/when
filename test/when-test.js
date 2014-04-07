var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var refute = buster.refute;
var fail = buster.referee.fail;

var when = require('../when');

function identity(val) { return val; }
function constant(val) { return function() { return val; }; }

var sentinel = {};
var other = {};

var fakePromise = new FakePromise();

// Untrusted, non-Promises/A-compliant promise
function FakePromise(val) {
	this.then = function (cb) {
		if (cb) {
			cb(val);
		}
		return this;
	};
}

buster.testCase('when', {
	'should return a promise for a value': function() {
		var result = when(1);
		assert(typeof result.then == 'function');
	},

	'should return a promise for a promise': function() {
		var result = when(fakePromise);
		assert(typeof result.then == 'function');
	},

	'should not return the input promise': function() {
		var result = when(fakePromise, identity);
		assert(typeof result.then == 'function');
		refute.same(result, fakePromise);
	},

	'should return a promise that forwards for a value': function() {
		var result = when(1, constant(2));

		assert(typeof result.then == 'function');

		return result.then(
			function(val) {
				assert.equals(val, 2);
			},
			fail
		);
	},

	'should invoke fulfilled handler asynchronously for value': function() {
		var val = other;

		try {
			return when({}, function() {
				assert.same(val, sentinel);
			});
		} finally {
			val = sentinel;
		}
	},

	'should invoke fulfilled handler asynchronously for fake promise': function() {
		var val = other;

		try {
			return when(fakePromise, function() {
				assert.same(val, sentinel);
			});
		} finally {
			val = sentinel;
		}
	},

	'should invoke fulfilled handler asynchronously for resolved promise': function() {
		var val = other;

		try {
			return when(when.resolve(), function() {
				assert.same(val, sentinel);
			});
		} finally {
			val = sentinel;
		}
	},

	'should invoke rejected handler asynchronously for rejected promise': function() {
		var val = other;

		try {
			return when(when.reject(),
				fail, function() { assert.same(val, sentinel); }
			);
		} finally {
			val = sentinel;
		}
	},

	'should support deep nesting in promise chains': function() {
		var d, result;

		d = when.defer();
		d.resolve(false);

		result = when(when(d.promise.then(function(val) {
			var d = when.defer();
			d.resolve(val);
			return when(d.promise.then(identity), identity).then(
				function(val) {
					return !val;
				}
			);
		})));

		return result.then(
			function(val) {
				assert(val);
			},
			fail
		);
	},

	'should return a resolved promise for a resolved input promise': function() {
		return when(when.resolve(true)).then(
			function(val) {
				assert(val);
			},
			fail
		);
	},

	'should assimilate untrusted promises':function () {
		var untrusted, result;

		// unstrusted promise should never be returned by when()
		untrusted = new FakePromise();
		result = when(untrusted);

		refute.equals(result, untrusted);
		refute(result instanceof FakePromise);
	},

	'should assimilate intermediate promises returned by callbacks':function () {
		var result;

		// untrusted promise returned by an intermediate
		// handler should be assimilated
		result = when(1,
			function (val) {
				return new FakePromise(val + 1);
			}
		).then(
			function (val) {
				assert.equals(val, 2);
			},
			fail
		);

		refute(result instanceof FakePromise);

		return result;
	},

	'should assimilate intermediate promises and forward results':function () {
		var untrusted, result;

		untrusted = new FakePromise(1);

		result = when(untrusted, function (val) {
			return new FakePromise(val + 1);
		});

		refute.equals(result, untrusted);
		refute(result instanceof FakePromise);

		return when(result,
			function (val) {
				assert.equals(val, 2);
				return new FakePromise(val + 1);
			}
		).then(
			function (val) {
				assert.equals(val, 3);
			},
			fail
		);
	}
});
