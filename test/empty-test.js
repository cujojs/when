(function(buster, define) {

var assert = buster.assert;

define('when/empty-test', function (require) {

	var Promise = require('when/Promise');

	buster.testCase('Promise.empty', {
		'should return promise': function() {
			assert(Promise.empty() instanceof Promise);
			assert.isFunction(Promise.empty().then);
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
