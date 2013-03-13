(function(buster, define) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

define('when.reduce-test', function (require) {

	var when, delay, resolved, reject;

	when = require('when');
	delay = require('when/delay');
	resolved = when.resolve;
	reject = when.reject;

	function plus(sum, val) {
		return sum + val;
	}

	function later(val) {
		return delay(val, Math.random() * 10);
	}

	buster.testCase('when.reduce', {

		'should reduce values without initial value': function(done) {
			when.reduce([1,2,3], plus).then(
				function(result) {
					assert.equals(result, 6);
				},
				fail
			).ensure(done);
		},

		'should reduce values with initial value': function(done) {
			when.reduce([1,2,3], plus, 1).then(
				function(result) {
					assert.equals(result, 7);
				},
				fail
			).ensure(done);
		},

		'should reduce values with initial promise': function(done) {
			when.reduce([1,2,3], plus, resolved(1)).then(
				function(result) {
					assert.equals(result, 7);
				},
				fail
			).ensure(done);
		},

		'should reduce promised values without initial value': function(done) {
			var input = [resolved(1), resolved(2), resolved(3)];
			when.reduce(input, plus).then(
				function(result) {
					assert.equals(result, 6);
				},
				fail
			).ensure(done);
		},

		'should reduce promised values with initial value': function(done) {
			var input = [resolved(1), resolved(2), resolved(3)];
			when.reduce(input, plus, 1).then(
				function(result) {
					assert.equals(result, 7);
				},
				fail
			).ensure(done);
		},

		'should reduce promised values with initial promise': function(done) {
			var input = [resolved(1), resolved(2), resolved(3)];
			when.reduce(input, plus, resolved(1)).then(
				function(result) {
					assert.equals(result, 7);
				},
				fail
			).ensure(done);
		},

		'should reduce empty input with initial value': function(done) {
			var input = [];
			when.reduce(input, plus, 1).then(
				function(result) {
					assert.equals(result, 1);
				},
				fail
			).ensure(done);
		},

		'should reduce empty input with initial promise': function(done) {
			when.reduce([], plus, resolved(1)).then(
				function(result) {
					assert.equals(result, 1);
				},
				fail
			).ensure(done);
		},

		'should reject when input contains rejection': function(done) {
			var input = [resolved(1), reject(2), resolved(3)];
			when.reduce(input, plus, resolved(1)).then(
				fail,
				function(result) {
					assert.equals(result, 2);
				}
			).ensure(done);
		},

		'should reject with TypeError when input is empty and no initial value or promise provided': function(done) {
			// This test intentionally causes a TypeError to be thrown, and when/debug's
			// default behavior is to rethrow it in nextTick.  So, we temporarily clobber
			// the list of exception types to rethrow to allow this test to run
			// with when/debug enabled.
			// This has no effect in non-debug mode.
			var debugSave = when.debug;
			when.debug = { exceptionsToRethrow: {} };

			when.reduce([], plus).then(
				fail,
				function(e) {
					assert(e instanceof TypeError);
				}
			).ensure(function() {
				when.debug = debugSave;
				done();
			});
		},

		'should allow sparse array input without initial': function(done) {
			when.reduce([ , , 1, , 1, 1], plus).then(
				function(result) {
					assert.equals(result, 3);
				},
				fail
			).ensure(done);
		},

		'should allow sparse array input with initial': function(done) {
			when.reduce([ , , 1, , 1, 1], plus, 1).then(
				function(result) {
					assert.equals(result, 4);
				},
				fail
			).ensure(done);
		},

		'should reduce in input order': function(done) {
			when.reduce([later(1), later(2), later(3)], plus, '').then(
				function(result) {
					assert.equals(result, '123');
				},
				fail
			).ensure(done);
		},

		'should accept a promise for an array': function(done) {
			when.reduce(resolved([1, 2, 3]), plus, '').then(
				function(result) {
					assert.equals(result, '123');
				},
				fail
			).ensure(done);
		},

		'should resolve to initialValue when input promise does not resolve to an array': function(done) {
			when.reduce(resolved(123), plus, 1).then(
				function(result) {
					assert.equals(result, 1);
				},
				fail
			).ensure(done);
		},

		'should provide correct basis value': function(done) {
			function insertIntoArray(arr, val, i) {
				arr[i] = val;
				return arr;
			}

			when.reduce([later(1), later(2), later(3)], insertIntoArray, []).then(
				function(result) {
					assert.equals(result, [1,2,3]);
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
