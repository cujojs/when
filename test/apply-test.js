(function(buster, define) {

var assert = buster.assert;

// variadic arguments-based callback
function f() {
	var sum, i = arguments.length;

	sum = 0;
	while(i) {
		sum += arguments[--i];
	}

	return sum;
}

define('when/apply-test', function (require) {

	var apply;

	apply = require('when/apply');

	buster.testCase('when/apply', {
		'should spread array onto arguments': function() {
			assert.equals(6, apply(f)([1,2,3]));
		},

		'should fail for non Array-like input': function() {
			assert.exception(function() {
				apply(f)(1,2,3);
			});
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
