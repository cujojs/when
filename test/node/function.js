(function(buster, node_fn, when) {
var assert = buster.assert;
var fail   = buster.fail;

function assertIsPromise(something) {
  var message = 'Object is not a promise';
  buster.assert(when.isPromise(something), message);
}

buster.testCase('when/node/function', {
	'apply': {
		'should return promise': function() {
			var result = node_fn.apply(function() {});
			assertIsPromise(result);
		},

		'the returned promise': {
			'should be resolved with the 2nd arg to the callback': function(done) {
				function async(cb) {
					cb(null, 10);
				}

				var promise = node_fn.apply(async);
				promise.then(function(value) {
					assert.equals(value, 10);
				}, fail).always(done);
			},

			'should be rejected with the 1st arg to the callback': function(done) {
				var error = new Error('foobar');
				function async(cb) {
					cb(error);
				}

				var promise = node_fn.apply(async);
				promise.then(fail, function(reason) {
					assert.same(reason, error);
				}).always(done);
			},

			'should be resolved to an array for multi-arg callbacks': function(done) {
				function async(cb) {
					cb(null, 10, 20, 30);
				}

				var promise = node_fn.apply(async);
				promise.then(function(values) {
					assert.equals(values, [10, 20, 30]);
				}).always(done);
			}
		},

		'should forward an array of args to the function': function(done) {
			function async(x, y, cb) {
				cb(null, x + y);
			}

			var promise = node_fn.apply(async, [10, 20]);
			promise.then(function(value) {
				assert.equals(value, 30);
			}).always(done);
		}
	},

	'call': {
		'should return promise': function() {
			var result = node_fn.call(function() {});
			assertIsPromise(result);
		},

		'the returned promise': {
			'should be resolved with the 2nd arg to the callback': function(done) {
				function async(cb) {
					cb(null, 10);
				}

				var promise = node_fn.call(async);
				promise.then(function(value) {
					assert.equals(value, 10);
				}, fail).always(done);
			},

			'should be rejected with the 1st arg to the callback': function(done) {
				var error = new Error('foobar');
				function async(cb) {
					cb(error);
				}

				var promise = node_fn.call(async);
				promise.then(fail, function(reason) {
					assert.same(reason, error);
				}).always(done);
			},

			'should be resolved to an array for multi-arg callbacks': function(done) {
				function async(cb) {
					cb(null, 10, 20, 30);
				}

				var promise = node_fn.call(async);
				promise.then(function(values) {
					assert.equals(values, [10, 20, 30]);
				}).always(done);
			}
		},

		'should forward extra arguments to the function': function(done) {
			function async(x, y, cb) {
				cb(null, x + y);
			}

			var promise = node_fn.call(async, 10, 20);
			promise.then(function(value) {
				assert.equals(value, 30);
			}).always(done);
		}
	}
});
})(require('buster'), require('../../node/function'), require('../../when'));
