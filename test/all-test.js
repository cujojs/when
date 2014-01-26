(function(buster, define) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

define('when.all-test', function (require) {

	var when, resolved, rejected;

	when = require('when');
	resolved = when.resolve;
	rejected = when.reject;

	buster.testCase('when.all', {

		'should resolve empty input': function(done) {
			return when.all([]).then(
				function(result) {
					assert.equals(result, []);
				},
				fail
			).ensure(done);
		},

		'should resolve values array': function(done) {
			var input = [1, 2, 3];
			when.all(input).then(
				function(results) {
					assert.equals(results, input);
				},
				fail
			).ensure(done);
		},

		'should resolve promises array': function(done) {
			var input = [resolved(1), resolved(2), resolved(3)];
			when.all(input).then(
				function(results) {
					assert.equals(results, [1, 2, 3]);
				},
				fail
			).ensure(done);
		},

		'should resolve sparse array input': function(done) {
			var input = [, 1, , 1, 1 ];
			when.all(input).then(
				function(results) {
					assert.equals(results, input);
				},
				fail
			).ensure(done);
		},

		'should reject if any input promise rejects': function(done) {
			var input = [resolved(1), rejected(2), resolved(3)];
			when.all(input).then(
				fail,
				function(failed) {
					assert.equals(failed, 2);
				}
			).ensure(done);
		},

		'should accept a promise for an array': function(done) {
			var expected, input;

			expected = [1, 2, 3];
			input = resolved(expected);

			when.all(input).then(
				function(results) {
					assert.equals(results, expected);
				},
				fail
			).ensure(done);
		},

		'should resolve to empty array when input promise does not resolve to array': function(done) {
			when.all(resolved(1)).then(
				function(result) {
					assert.equals(result, []);
				},
				fail
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
