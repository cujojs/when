var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var when = require('../when');
var sentinel = { value: 'sentinel' };

function even(x) {
	return x % 2 === 0;
}

function evenPromise(x) {
	return when(even(x));
}

buster.testCase('when.filter', {

	'should pass index to predicate as second param': function() {
		return when.filter(['a','b','c'], function(x, i) {
			assert(typeof i === 'number');
			return true;
		});
	},

	'should filter input values array': function() {
		var input = [1, 2, 3];
		return when.filter(input, even).then(
			function(results) {
				assert.equals(input.filter(even), results);
			});
	},

	'should filter input promises array': function() {
		var input = [1, 2, 3];
		return when.filter(input.map(when), even).then(
			function(results) {
				assert.equals(input.filter(even), results);
			});
	},

	'should filter input when predicate returns a promise': function() {
		var input = [1,2,3];
		return when.filter(input, evenPromise).then(
			function(results) {
				assert.equals(input.filter(even), results);
			});
	},

	'should accept a promise for an array': function() {
		var input = [1,2,3];
		return when.filter(when(input), even).then(
			function(results) {
				assert.equals(input.filter(even), results);
			});
	},

	'should fulfill with empty array when input promise fulfills with non-array': function() {
		return when.filter(when(123), even).then(
			function(result) {
				assert.equals(result, []);
			});
	},

	'should reject when input contains rejection': function() {
		var input = [when(1), when.reject(sentinel), 3];
		return when.filter(input, even)['catch'](
			function(e) {
				assert.same(e, sentinel);
			});
	},

	'should reject when input is a rejected promise': function() {
		return when.filter(when.reject(sentinel), even)['catch'](
			function(e) {
				assert.same(e, sentinel);
			});
	},

	'should match Array.prototype.filter behavior when predicate modifies array': function() {
		// Test to match Array.prototype.filter behavior
		var a = [1, 2, 3, 4];
		var b = a.slice();
		var expected = b.filter(makePredicate(b));

		function makePredicate(a) {
			return function (n, i){
				a[i] = 'fail';
				return n % 2 === 0;
			};
		}

		return when.filter(a, makePredicate(a)).then(function(results) {
			assert.equals(results, expected);
		});
	}

});
