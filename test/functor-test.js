(function(buster, define) {

	var assert, fail, sentinel;

	assert = buster.assert;
	fail = buster.assertions.fail;

	sentinel = {};

	define('when/functor-test', function (require) {

		var Promise = require('when/Promise');
		var fulfilled = Promise.of(sentinel);

		function assertSame(p1, p2) {
			return p1.then(function(x) {
				return p2.then(function(y) {
					assert.same(x, y);
				});
			});
		}

		buster.testCase('functor', {
			'should satisfy identity': function() {
				return assertSame(fulfilled, fulfilled.map(function(x) { return x; }));
			},

			'should satisfy composition': function() {
				function f(x) { return x + 'f'; }
				function g(x) { return x + 'g'; }

				return assertSame(Promise.of('a').map(function(x) {
					return f(g(x));
				}), Promise.of('a').map(g).map(f));
			},

			'should retain promises in composition': function() {
				function f(x) { return fulfilled; }
				function g(x) { return x.then(function(x) { return x; }); }

				return assertSame(Promise.of(fulfilled).map(function(x) {
					return f(g(x));
				}), Promise.of(fulfilled).map(g).map(f));
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
