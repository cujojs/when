(function(buster, define) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

define('when.reject-test', function (require) {

	var when;

	when = require('when');

	buster.testCase('when.reject', {

		'should reject an immediate value': function(done) {
			var expected = 123;

			when.reject(expected).then(
				fail,
				function(value) {
					assert.equals(value, expected);
				}
			).ensure(done);
		},

		'should reject a resolved promise': function(done) {
			var expected, d;

			expected = 123;
			d = when.defer();
			d.resolve(expected);

			when.reject(d.promise).then(
				fail,
				function(value) {
					assert.equals(value, expected);
				}
			).ensure(done);
		},

		'should reject a rejected promise': function(done) {
			var expected, d;

			expected = 123;
			d = when.defer();
			d.reject(expected);

			when.reject(d.promise).then(
				fail,
				function(value) {
					assert.equals(value, expected);
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
