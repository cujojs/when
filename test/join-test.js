(function(buster, define) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

define('when.join-test', function (require) {

	var when, resolved, rejected;

	when = require('when');
	resolved = when.resolve;
	rejected = when.reject;

	buster.testCase('when.join', {

		'should resolve empty input': function(done) {
			return when.join().then(
				function(result) {
					assert.equals(result, []);
				},
				fail
			).ensure(done);
		},

		'should join values': function(done) {
			when.join(1, 2, 3).then(
				function(results) {
					assert.equals(results, [1, 2, 3]);
				},
				fail
			).ensure(done);
		},

		'should join promises array': function(done) {
			when.join(resolved(1), resolved(2), resolved(3)).then(
				function(results) {
					assert.equals(results, [1, 2, 3]);
				},
				fail
			).ensure(done);
		},

		'should join mixed array': function(done) {
			when.join(resolved(1), 2, resolved(3), 4).then(
				function(results) {
					assert.equals(results, [1, 2, 3, 4]);
				},
				fail
			).ensure(done);
		},

		'should reject if any input promise rejects': function(done) {
			when.join(resolved(1), rejected(2), resolved(3)).then(
				fail,
				function(failed) {
					assert.equals(failed, 2);
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
