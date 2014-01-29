(function(buster, define) {

var assert = buster.assert;

define('when/monad-test', function (require) {

	var Promise = require('when/Promise');

	function assertSame(p1, p2) {
		return p1.then(function(x) {
			return p2.then(function(y) {
				assert.same(x, y);
			});
		});
	}

	buster.testCase('monad', {
		'should satisfy left identity': function() {
			// m.of(a).chain(f) is equivalent to f(a)
			function f(x) { return Promise.of(x + 'f'); }

			return assertSame(Promise.of('a').flatMap(f), f('a'));
		},

		'should satisfy right identity': function() {
			// m.chain(m.of) is equivalent to m
			var p = Promise.of('a');
			return assertSame(p.flatMap(Promise.of), p);
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
