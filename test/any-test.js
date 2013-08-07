(function(buster, define) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

function contains(array, item) {
	for(var i=array.length - 1; i >= 0; --i) {
		if(array[i] === item) {
			return true;
		}
	}

	return false;
}

define('when.any-test', function (require) {

	var when, resolved, rejected;

	when = require('when');
	resolved = when.resolve;
	rejected = when.reject;

	buster.testCase('when.any', {

		'should resolve to undefined with empty input array': function(done) {
			when.any([],
				function(result) {
					refute.defined(result);
				},
				fail
			).ensure(done);
		},

		'should resolve with an input value': function(done) {
			var input = [1, 2, 3];
			when.any(input,
				function(result) {
					assert(contains(input, result));
				},
				fail
			).ensure(done);
		},

		'should resolve with a promised input value': function(done) {
			var input = [resolved(1), resolved(2), resolved(3)];
			when.any(input,
				function(result) {
					assert(contains([1, 2, 3], result));
				},
				fail
			).ensure(done);
		},

		'should reject with all rejected input values if all inputs are rejected': function(done) {
			var input = [rejected(1), rejected(2), rejected(3)];
			when.any(input,
				fail,
				function(result) {
					assert.equals(result, [1, 2, 3]);
				}
			).ensure(done);
		},

		'should accept a promise for an array': function(done) {
			var expected, input;

			expected = [1, 2, 3];
			input = resolved(expected);

			when.any(input,
				function(result) {
					refute.equals(expected.indexOf(result), -1);
				},
				fail
			).ensure(done);
		},

		'should allow zero handlers': function(done) {
			var input = [1, 2, 3];
			when.any(input).then(
				function(result) {
					assert(contains(input, result));
				},
				fail
			).ensure(done);
		},

		'should resolve to undefined when input promise does not resolve to array': function(done) {
			when.any(resolved(1),
				function(result) {
					refute.defined(result);
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
