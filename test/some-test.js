(function(buster, define) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

function contains(array, value) {
	for(var i = array.length-1; i >= 0; i--) {
		if(array[i] === value) {
			return true;
		}
	}

	return false;
}

function isSubset(subset, superset) {
	var i, subsetLen;

	subsetLen = subset.length;

	if (subsetLen > superset.length) {
		return false;
	}

	for(i = 0; i<subsetLen; i++) {
		if(!contains(superset, subset[i])) {
			return false;
		}
	}

	return true;
}

define('when.some-test', function (require) {

	var when, resolved, rejected;

	when = require('when');
	resolved = when.resolve;
	rejected = when.reject;

	buster.testCase('when.some', {

		'should resolve empty input': function(done) {
			when.some([], 1,
				function(result) {
					assert.equals(result, []);
				},
				fail
			).ensure(done);
		},

		'should resolve values array': function(done) {
			var input = [1, 2, 3];
			when.some(input, 2,
				function(results) {
					assert(isSubset(results, input));
				},
				fail
			).ensure(done);
		},

		'should resolve promises array': function(done) {
			var input = [resolved(1), resolved(2), resolved(3)];
			when.some(input, 2,
				function(results) {
					assert(isSubset(results, [1, 2, 3]));
				},
				fail
			).ensure(done);
		},

		'should resolve sparse array input': function(done) {
			var input = [, 1, , 2, 3 ];
			when.some(input, 2,
				function(results) {
					assert(isSubset(results, input));
					done();
				},
				fail
			).ensure(done);
		},

		'should reject with all rejected input values if resolving howMany becomes impossible': function(done) {
			var input = [resolved(1), rejected(2), rejected(3)];
			when.some(input, 2,
				fail,
				function(failed) {
					assert.equals(failed, [2, 3]);
				}
			).ensure(done);
		},

		'should accept a promise for an array': function(done) {
			var expected, input;

			expected = [1, 2, 3];
			input = resolved(expected);

			when.some(input, 2,
				function(results) {
					assert.equals(results.length, 2);
				},
				fail
			).ensure(done);
		},

		'should resolve to empty array when input promise does not resolve to array': function(done) {
			when.some(resolved(1), 1,
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
