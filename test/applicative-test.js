(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

define('when/applicative-test', function (require) {

	var Promise = require('when/Promise');
	var fulfilled = Promise.of(sentinel);

	function assertSame(p1, p2) {
		return p1.then(function(x) {
			return p2.then(function(y) {
				assert.same(x, y);
			});
		});
	}

	buster.testCase('applicative', {
		'of': {
			'should exist on constructor': function() {
				assert.isFunction(Promise.prototype.constructor.of);
			},

			'should return promise': function() {
				assert(Promise.empty() instanceof Promise);
				assert.isFunction(Promise.empty().then);
			},

			'should return promise for verbatim value': function() {
				return Promise.of(fulfilled).then(function(x) {
					assert.same(x, fulfilled);
				});
			},

			'should be async': function() {
				var x = sentinel;
				Promise.of().then(function() {
					x = void 0;
				});

				assert.same(x, sentinel);
			}
		},

		'should satisfy identity': function() {
			return assertSame(fulfilled,
				Promise.of(function(x) { return x; }).ap(fulfilled));
		},

		'should satisfy composition': function() {
			var u = Promise.of(function(x) { return x + 'f'; });
			var v = Promise.of(function(x) { return x + 'g'; });
			var a = Promise.of('a');

			var p1 = Promise.of(function(f) {
				return function(g) {
					return function(x) {
						return f(g(x));
					};
				};
			}).ap(u).ap(v).ap(a);

			var p2 = u.ap(v.ap(a));

			return assertSame(p1, p2);
		},

		'should satisfy homomorphism': function() {
			function f(x) { return x + 'f'; }

			var p1 = Promise.of(f).ap(Promise.of('a'));
			var p2 = Promise.of(f('a'));

			return assertSame(p1, p2);
		},

		'should satisfy interchange': function() {
			function f(x) { return x + 'f'; }

			var p1 = Promise.of(f).ap(Promise.of('a'));
			var p2 = Promise.of(function(f) { return f('a'); }).ap(Promise.of(f));

			return assertSame(p1, p2);
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
