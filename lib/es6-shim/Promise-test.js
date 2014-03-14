(function(buster, global, define) {

var assert = buster.assert;
var OrigPromise = global.Promise;

define('when/es6-shim/Promise-test', function (require) {

	var Promise = require('when/es6-shim/Promise');

	buster.testCase('when/es6-shim/PromiseMonitor', {

		tearDown: function() {
			global.Promise = OrigPromise;
		},

		'should publish global Promise': function() {
			assert.same(Promise, global.Promise);
		}

	});

});
}(
	this.buster || require('buster'),
	typeof global !== 'undefined' ? global : this,
	typeof define === 'function' && define.amd ? define : function (id, factory) {
	var packageName = id.split(/[\/\-\.]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
	pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
	factory(function (moduleId) {
		return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
	});
}
));
