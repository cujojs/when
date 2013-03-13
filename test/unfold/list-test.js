(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

function noop() {}

define('when/unfold/list-test', function (require) {

	var list;

	list = require('when/unfold/list');

	buster.testCase('when/unfold/list', {

		'should produce an empty list when proceed returns truthy immediately': function(done) {
			var spy;

			spy = this.stub().returns(true);

			list(noop, spy, sentinel).then(
				function(value) {
					assert.equals(value, []);
				}
			).ensure(done);
		},

		'should produce a list of N elements': function(done) {
			var len = 3;

			function condition(i) {
				return i == len;
			}

			function generate(x) {
				return [x, x+1];
			}

			list(generate, condition, 0).then(
				function(result) {
					assert.equals(result.length, len);
					assert.equals(result, [0, 1, 2]);
				}
			).ensure(done);
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
