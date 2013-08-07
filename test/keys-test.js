(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

function assertNoKeys(object) {
	var key, count = 0;
	for(key in object) {
		if(object.hasOwnProperty(key)) {
			count++;
		}
	}
	assert.equals(count, 0);
}

define('when/keys-test', function (require) {

	var keys, when, resolve, reject;

	keys = require('when/keys');
	when = require('when');
	resolve = when.resolve;
	reject = when.reject;

	buster.testCase('when/keys', {

		'all': {
			'should resolve empty input': function() {
				return keys.all({}).then(assertNoKeys);
			},

			'should resolve input values': function(done) {
				var input = { a: 1, b: 2, c: 3 };
				keys.all(input).then(
					function(results) {
						assert.equals(results, input);
					},
					fail
				).ensure(done);
			},

			'should resolve promised keys': function(done) {
				var input = { a: resolve(1), b: 2, c: resolve(3) };
				keys.all(input).then(
					function(results) {
						assert.equals(results, { a: 1, b: 2, c: 3 });
					},
					fail
				).ensure(done);
			},

			'should resolve promise for keys': function(done) {
				var input = { a: resolve(1), b: 2, c: resolve(3) };
				keys.all(resolve(input)).then(
					function(results) {
						assert.equals(results, { a: 1, b: 2, c: 3 });
					},
					fail
				).ensure(done);
			},

			'should reject if key rejects': function(done) {
				var input = { a: 1, b: reject(sentinel), c: 3 };
				keys.all(input).then(
					fail,
					function(e) {
						assert.same(e, sentinel);
					}
				).ensure(done);
			},

			'should reject if input promise rejects': function(done) {
				keys.all(reject(sentinel)).then(
					fail,
					function(e) {
						assert.same(e, sentinel);
					}
				).ensure(done);
			}

		},

		'map': {
			'should resolve empty input': function() {
				return keys.map({}).then(assertNoKeys);
			},

			'should map keys': function(done) {
				var input = { a: 1, b: 2, c: 3 };
				keys.map(input, function(x) {
					return x + 1;
				}).then(
					function(results) {
						assert.equals(results, { a: 2, b: 3, c: 4 });
					},
					fail
				).ensure(done);
			},

			'should map promised keys': function(done) {
				var input = { a: resolve(1), b: 2, c: resolve(3) };
				keys.map(input, function(x) {
					return x + 1;
				}).then(
					function(results) {
						assert.equals(results, { a: 2, b: 3, c: 4 });
					},
					fail
				).ensure(done);
			},

			'should map promise for keys': function(done) {
				var input = { a: resolve(1), b: 2, c: resolve(3) };
				keys.map(resolve(input), function(x) {
					return x + 1;
				}).then(
					function(results) {
						assert.equals(results, { a: 2, b: 3, c: 4 });
					},
					fail
				).ensure(done);
			},

			'should reject if key rejects': function(done) {
				var input = { a: 1, b: reject(sentinel), c: 3 };
				keys.map(input, function(x) {
					return x + 1;
				}).then(
					fail,
					function(e) {
						assert.same(e, sentinel);
					}
				).ensure(done);
			},

			'should reject if input promise rejects': function(done) {
				keys.map(reject(sentinel), function(x) {
					return x + 1;
				}).then(
					fail,
					function(e) {
						assert.same(e, sentinel);
					}
				).ensure(done);
			},

			'should reject if reduceFunc rejects': function(done) {
				var input = { a: 1, b: 2, c: 3 };
				keys.map(input, function() {
					return reject(sentinel);
				}, 0).then(
					fail,
					function(e) {
						assert.same(e, sentinel);
					}
				).ensure(done);
			},

			'should reject if reduceFunc throws': function(done) {
				var input = { a: 1, b: 2, c: 3 };
				keys.map(input, function() {
					throw sentinel;
				}, 0).then(
					fail,
					function(e) {
						assert.same(e, sentinel);
					}
				).ensure(done);
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
