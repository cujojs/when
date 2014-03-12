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

		'should resolve empty input': function() {
			return when.some([], 1).then(
				function(result) {
					assert.equals(result, []);
				});
		},

		'should resolve values array': function() {
			var input = [1, 2, 3];
			return when.some(input, 2).then(
				function(results) {
					assert(isSubset(results, input));
				});
		},

		'should resolve promises array': function() {
			var input = [resolved(1), resolved(2), resolved(3)];
			return when.some(input, 2).then(
				function(results) {
					assert(isSubset(results, [1, 2, 3]));
				});
		},

		'should resolve sparse array input': function() {
			var input = [, 1, , 2, 3 ];
			return when.some(input, 2).then(
				function(results) {
					assert(isSubset(results, input));
				});
		},

		'should reject with all rejected input values if resolving howMany becomes impossible': function() {
			var input = [resolved(1), rejected(2), rejected(3)];
			return when.some(input, 2).then(
				fail,
				function(failed) {
					assert.equals(failed, [2, 3]);
				});
		},

		'should accept a promise for an array': function() {
			var expected, input;

			expected = [1, 2, 3];
			input = resolved(expected);

			return when.some(input, 2).then(
				function(results) {
					assert.equals(results.length, 2);
				});
		},

		'should resolve to empty array when input promise does not resolve to array': function() {
			return when.some(resolved(1), 1).then(
				function(result) {
					assert.equals(result, []);
				});
		},

		'should resolve to empty array when n is zero': function() {
			return when.some([1,2,3], 0).then(function(result) {
				assert.equals(result, []);
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
