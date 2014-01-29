(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = { value: 'sentinel' };

function add(a, b) {
	return a + b;
}

define('when/foldable-test', function (require) {

	var Promise = require('when/Promise');

	buster.testCase('foldable', {

		'foldr': {
			'should combine value and initial': function() {
				return Promise.of('a').foldr(add, 'b').then(function(x) {
					assert.equals(x, 'ab');
				});
			},

			'should propagate rejection': function() {
				return Promise.reject(sentinel).foldr(add, 'a').then(fail, function(x) {
					assert.same(x, sentinel);
				});
			}
		},

		'foldl': {
			'should combine initial and value': function() {
				return Promise.of('a').foldl(add, 'b').then(function(x) {
					assert.equals(x, 'ba');
				});
			},

			'should propagate rejection': function() {
				return Promise.reject(sentinel).foldl(add, 'a').then(fail, function(x) {
					assert.same(x, sentinel);
				});
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
