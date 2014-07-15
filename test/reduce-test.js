var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when = require('../when');

function plus(sum, val) {
	return sum + val;
}

function later(val) {
	return when(val).delay(Math.random()*10);
}

buster.testCase('when.reduce', {

	'reduceRight': {
		'should reduce from the right': function() {
			return when.reduceRight(['a', later('b'), when.resolve('c')], plus).then(
				function(result) {
					assert.equals(result, 'cba');
				});
		},

		'should reduce from the right with initial value': function() {
			return when.reduceRight(['a', later('b'), when.resolve('c')], plus, 'z').then(
				function(result) {
					assert.equals(result, 'zcba');
				});
		},

		'should reduce values with initial promise': function() {
			return when.reduceRight([1,2,3], plus, when.resolve(1)).then(
				function(result) {
					assert.equals(result, 7);
				});
		},

		'should reduce promised values without initial value': function() {
			var input = [when.resolve(1), when.resolve(2), when.resolve(3)];
			return when.reduceRight(input, plus).then(
				function(result) {
					assert.equals(result, 6);
				});
		},

		'should reduce promised values with initial value': function() {
			var input = [when.resolve(1), when.resolve(2), when.resolve(3)];
			return when.reduceRight(input, plus, 1).then(
				function(result) {
					assert.equals(result, 7);
				});
		},

		'should reduce promised values with initial promise': function() {
			var input = [when.resolve(1), when.resolve(2), when.resolve(3)];
			return when.reduceRight(input, plus, when.resolve(1)).then(
				function(result) {
					assert.equals(result, 7);
				});
		},

		'should reduce empty input with initial value': function() {
			var input = [];
			return when.reduceRight(input, plus, 1).then(
				function(result) {
					assert.equals(result, 1);
				});
		},

		'should reduce empty input with initial promise': function() {
			return when.reduceRight([], plus, when.resolve(1)).then(
				function(result) {
					assert.equals(result, 1);
				});
		},

		'should reject when input contains rejection': function() {
			var input = [when.resolve(1), when.reject(2), when.resolve(3)];
			return when.reduceRight(input, plus, when.resolve(1)).then(
				fail,
				function(result) {
					assert.equals(result, 2);
				});
		},

		'should reject with TypeError when input is empty and no initial value or promise provided': function() {
			return when.reduceRight([], plus).then(
				fail,
				function(e) {
					assert(e instanceof TypeError);
				});
		},

		'should allow sparse array input without initial': function() {
			return when.reduceRight([ , , 1, , 1, 1], plus).then(
				function (result) {
					assert.equals(result, 3);
				});
		},

		'should allow sparse array input with initial': function() {
			return when.reduceRight([ , , 1, , 1, 1], plus, 1).then(
				function(result) {
					assert.equals(result, 4);
				});
		},

		'should fulfill with initial when input promise does not fulfill with array': function() {
			return when.reduceRight(when.resolve(123), plus, 1).then(
				function(result) {
					assert.equals(result, 1);
				});
		},

		'should provide correct basis value': function() {
			function insert(arr, val, i) {
				arr[i] = val;
				return arr;
			}

			return when.reduceRight([when(1), when(2), when(3)], insert, []).then(
				function(result) {
					assert.equals(result, [1,2,3]);
				});
		}
	},

	'reduce': {

		'should reduce values without initial value': function() {
			return when.reduce([1,2,3], plus).then(
				function(result) {
					assert.equals(result, 6);
				});
		},

		'should reduce values with initial value': function() {
			return when.reduce([1,2,3], plus, 1).then(
				function(result) {
					assert.equals(result, 7);
				});
		},

		'should reduce values with initial promise': function() {
			return when.reduce([1,2,3], plus, when.resolve(1)).then(
				function(result) {
					assert.equals(result, 7);
				});
		},

		'should reduce promised values without initial value': function() {
			var input = [when.resolve(1), when.resolve(2), when.resolve(3)];
			return when.reduce(input, plus).then(
				function(result) {
					assert.equals(result, 6);
				});
		},

		'should reduce promised values with initial value': function() {
			var input = [when.resolve(1), when.resolve(2), when.resolve(3)];
			return when.reduce(input, plus, 1).then(
				function(result) {
					assert.equals(result, 7);
				});
		},

		'should reduce promised values with initial promise': function() {
			var input = [when.resolve(1), when.resolve(2), when.resolve(3)];
			return when.reduce(input, plus, when.resolve(1)).then(
				function(result) {
					assert.equals(result, 7);
				});
		},

		'should reduce empty input with initial value': function() {
			var input = [];
			return when.reduce(input, plus, 1).then(
				function(result) {
					assert.equals(result, 1);
				});
		},

		'should reduce empty input with initial promise': function() {
			return when.reduce([], plus, when.resolve(1)).then(
				function(result) {
					assert.equals(result, 1);
				});
		},

		'should reject when input contains rejection': function() {
			var input = [when.resolve(1), when.reject(2), when.resolve(3)];
			return when.reduce(input, plus, when.resolve(1)).then(
				fail,
				function(result) {
					assert.equals(result, 2);
				});
		},

		'should reject with TypeError when input is empty and no initial value or promise provided': function() {
			return when.reduce([], plus).then(
				fail,
				function(e) {
					assert(e instanceof TypeError);
				});
		},

		'should allow sparse array input without initial': function() {
			return when.reduce([ , , 1, , 1, 1], plus).then(
				function (result) {
					assert.equals(result, 3);
				});
		},

		'should allow sparse array input with initial': function() {
			return when.reduce([ , , 1, , 1, 1], plus, 1).then(
				function(result) {
					assert.equals(result, 4);
				});
		},

		'should reduce in input order': function() {
			return when.reduce([later(1), when(2), when(3)], plus, '').then(
				function(result) {
					assert.equals(result, '123');
				});
		},

		'should accept a promise for an array': function() {
			return when.reduce(when.resolve([1, 2, 3]), plus, '').then(
				function(result) {
					assert.equals(result, '123');
				});
		},

		'should fulfill with initial when input promise does not fulfill with array': function() {
			return when.reduce(when.resolve(123), plus, 1).then(
				function(result) {
					assert.equals(result, 1);
				});
		},

		'should provide correct basis value': function() {
			function insert(arr, val, i) {
				arr[i] = val;
				return arr;
			}

			return when.reduce([when(1), when(2), when(3)], insert, []).then(
				function(result) {
					assert.equals(result, [1,2,3]);
				});
		}
	}
});
