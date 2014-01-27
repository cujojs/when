(function(buster, define) {

var assert = buster.assert;

define('when/monoid-test', function (require) {

	var Promise = require('when/Promise');

	buster.testCase('Promise.empty/concat', {
		'empty': {
			'should exist on constructor': function() {
				assert.isFunction(Promise.of().constructor.empty);
			},

			'should return promise': function() {
				assert(Promise.empty() instanceof Promise);
				assert.isFunction(Promise.empty().then);
			}
		},

		'concat': {
			'should satisfy left identity': function() {
				var x = {};
				return Promise.of(x).concat(Promise.empty()).then(function(y) {
					assert.same(x, y);
				});
			},

			'should satisfy right identity': function() {
				var x = {};
				return Promise.empty().concat(Promise.of(x)).then(function(y) {
					assert.same(x, y);
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
