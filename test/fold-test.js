(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = { value: 'sentinel' };

define('when/fold-test', function (require) {

	var when = require('when');

	function sum(x, y) {
		return x + y;
	}

	function equal(x, y) {
		if (x !== y) { throw 'not equal!'; }
	}

	buster.testCase('fold', {

		'when calling fold on a promise': {
			'should pairwise combine two promises': function() {
				return when.resolve(1).fold(sum, 2).then(function(res){
					assert.equals(res, 3);
				});
			}, 'should still fail normally after a fold': function() {
				return when.resolve(1).fold(equal, 2).catch(function(res){
					assert.equals(res, 'not equal!');
				});
			}, 'should reject and not call fold if previous promise rejects': function() {
				return when.reject(1).fold(equal, 2).catch(function(res){
					assert.equals(res, 1);
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
