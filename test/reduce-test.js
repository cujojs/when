(function(buster, define) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

define('when.reduce-test', function (require) {

	var when, resolved, reject;

	when = require('when');
	resolved = when.resolve;
	reject = when.reject;

	function plus(sum, val) {
		return sum + val;
	}

	function later(val) {
		return when(val).delay(Math.random()*10);
	}

	buster.testCase('when.reduce', {

		'reduceRight': {
			'should reduce from the right': function() {
				return when.reduceRight(['a', later('b'), resolved('c')], plus).then(
					function(result) {
						assert.equals(result, 'cba');
					});
			},

			'should reduce from the right with initial value': function() {
				return when.reduceRight(['a', later('b'), resolved('c')], plus, 'z').then(
					function(result) {
						assert.equals(result, 'zcba');
					});
			},

			'should reduce values with initial promise': function() {
				return when.reduceRight([1,2,3], plus, resolved(1)).then(
					function(result) {
						assert.equals(result, 7);
					});
			},

			'should reduce promised values without initial value': function() {
				var input = [resolved(1), resolved(2), resolved(3)];
				return when.reduceRight(input, plus).then(
					function(result) {
						assert.equals(result, 6);
					});
			},

			'should reduce promised values with initial value': function() {
				var input = [resolved(1), resolved(2), resolved(3)];
				return when.reduceRight(input, plus, 1).then(
					function(result) {
						assert.equals(result, 7);
					});
			},

			'should reduce promised values with initial promise': function() {
				var input = [resolved(1), resolved(2), resolved(3)];
				return when.reduceRight(input, plus, resolved(1)).then(
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
				return when.reduceRight([], plus, resolved(1)).then(
					function(result) {
						assert.equals(result, 1);
					});
			},

			'should reject when input contains rejection': function() {
				var input = [resolved(1), reject(2), resolved(3)];
				return when.reduceRight(input, plus, resolved(1)).then(
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
				return when.reduceRight(resolved(123), plus, 1).then(
					function(result) {
						assert.equals(result, 1);
					});
			},

			'should provide correct basis value': function() {
				function insert(arr, val, i) {
					arr[i] = val;
					return arr;
				}

				return when.reduceRight([later(1), later(2), later(3)], insert, []).then(
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
				return when.reduce([1,2,3], plus, resolved(1)).then(
					function(result) {
						assert.equals(result, 7);
					});
			},

			'should reduce promised values without initial value': function() {
				var input = [resolved(1), resolved(2), resolved(3)];
				return when.reduce(input, plus).then(
					function(result) {
						assert.equals(result, 6);
					});
			},

			'should reduce promised values with initial value': function() {
				var input = [resolved(1), resolved(2), resolved(3)];
				return when.reduce(input, plus, 1).then(
					function(result) {
						assert.equals(result, 7);
					});
			},

			'should reduce promised values with initial promise': function() {
				var input = [resolved(1), resolved(2), resolved(3)];
				return when.reduce(input, plus, resolved(1)).then(
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
				return when.reduce([], plus, resolved(1)).then(
					function(result) {
						assert.equals(result, 1);
					});
			},

			'should reject when input contains rejection': function() {
				var input = [resolved(1), reject(2), resolved(3)];
				return when.reduce(input, plus, resolved(1)).then(
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
				return when.reduce([later(1), later(2), later(3)], plus, '').then(
					function(result) {
						assert.equals(result, '123');
					});
			},

			'should accept a promise for an array': function() {
				return when.reduce(resolved([1, 2, 3]), plus, '').then(
					function(result) {
						assert.equals(result, '123');
					});
			},

			'should fulfill with initial when input promise does not fulfill with array': function() {
				return when.reduce(resolved(123), plus, 1).then(
					function(result) {
						assert.equals(result, 1);
					});
			},

			'should provide correct basis value': function() {
				function insert(arr, val, i) {
					arr[i] = val;
					return arr;
				}

				return when.reduce([later(1), later(2), later(3)], insert, []).then(
					function(result) {
						assert.equals(result, [1,2,3]);
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
