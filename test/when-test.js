(function(buster, define) {

var assert, refute, fail, fakePromise, sentinel, other;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

function identity(val) { return val; }
function constant(val) { return function() { return val; }; }

sentinel = {};
other = {};

fakePromise = new FakePromise();

// Untrusted, non-Promises/A-compliant promise
function FakePromise(val) {
	this.then = function (cb) {
		if (cb) {
			cb(val);
		}
		return this;
	};
}

define('when-test', function (require) {

	var when;

	when = require('when');

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

		'should return a promise that forwards for a value': function(done) {
			var result = when(1, constant(2));

			assert(typeof result.then == 'function');

			result.then(
				function(val) {
					assert.equals(val, 2);
				},
				fail
			).ensure(done);
		},

		'should invoke fulfilled handler asynchronously for value': function(done) {
			var val = other;

			when({}, function() {
				assert.same(val, sentinel);
			}).ensure(done);

			val = sentinel;
		},

		'should invoke fulfilled handler asynchronously for fake promise': function(done) {
			var val = other;

			when(fakePromise, function() {
				assert.same(val, sentinel);
			}).ensure(done);

			val = sentinel;
		},

		'should invoke fulfilled handler asynchronously for resolved promise': function(done) {
			var val = other;

			when(when.resolve(), function() {
				assert.same(val, sentinel);
			}).ensure(done);

			val = sentinel;
		},

		'should invoke fulfilled handler asynchronously for rejected promise': function(done) {
			var val = other;

			when(when.reject(),
				fail,
				function() {
					assert.same(val, sentinel);
				}
			).ensure(done);

			val = sentinel;
		},

		'should support deep nesting in promise chains': function(done) {
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

			result.then(
				function(val) {
					assert(val);
				},
				fail
			).ensure(done);
		},

		'should return a resolved promise for a resolved input promise': function(done) {
			when(when.resolve(true)).then(
				function(val) {
					assert(val);
				},
				fail
			).ensure(done);
		},

		'should assimilate untrusted promises':function () {
			var untrusted, result;

			// unstrusted promise should never be returned by when()
			untrusted = new FakePromise();
			result = when(untrusted);

			refute.equals(result, untrusted);
			refute(result instanceof FakePromise);
		},

		'should assimilate intermediate promises returned by callbacks':function (done) {
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
			).ensure(done);

			refute(result instanceof FakePromise);
		},

		'should assimilate intermediate promises and forward results':function (done) {
			var untrusted, result;

			untrusted = new FakePromise(1);

			result = when(untrusted, function (val) {
				return new FakePromise(val + 1);
			});

			refute.equals(result, untrusted);
			refute(result instanceof FakePromise);

			when(result,
				function (val) {
					assert.equals(val, 2);
					return new FakePromise(val + 1);
				}
			).then(
				function (val) {
					assert.equals(val, 3);
				},
				fail
			).ensure(done);
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
