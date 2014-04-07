var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var refute = buster.refute;
var fail = buster.referee.fail;

var when = require('../when');

var sentinel = {};
var other = {};

function noop() {}


buster.testCase('lib/iterate', {

	'unfold': {
		'should invoke condition first': function(done) {
			function condition() {
				return true;
			}

			when.unfold(noop, condition, noop, sentinel).then(
				function(value) {
					assert.same(value, sentinel);
				}
			).ensure(done);
		},

		'should call generator until condition returns truthy': function(done) {
			function condition(i) {
				return i === 0;
			}

			var unspool = this.spy(function(x) {
				return [x, x-1];
			});

			when.unfold(unspool, condition, noop, 3).then(
				function() {
					assert.equals(unspool.callCount, 3);
				}
			).ensure(done);
		},

		'generator': {
			'should be allowed to return an array of promises': function(done) {
				function condition(i) {
					return i === 0;
				}

				var unspool = this.spy(function(x) {
					return [when.resolve(x), when.resolve(x-1)];
				});

				when.unfold(unspool, condition, noop, 3).then(
					function() {
						assert.equals(unspool.callCount, 3);
					}
				).ensure(done);
			},

			'should be allowed to return a promise for an array': function(done) {
				function condition(i) {
					return i === 0;
				}

				var unspool = this.spy(function(x) {
					return when.resolve([x, x-1]);
				});

				when.unfold(unspool, condition, noop, 3).then(
					function() {
						assert.equals(unspool.callCount, 3);
					}
				).ensure(done);
			},

			'should be allowed to return a promise for an array of promises': function(done) {
				function condition(i) {
					return i === 0;
				}

				var unspool = this.spy(function(x) {
					return when.resolve([when.resolve(x), when.resolve(x-1)]);
				});

				when.unfold(unspool, condition, noop, 3).then(
					function() {
						assert.equals(unspool.callCount, 3);
					}
				).ensure(done);
			}
		},

		'condition': {
			'should be allowed to return a promise that fulfills': function(done) {
				function condition(i) {
					return when.resolve(i === 0);
				}

				var unspool = this.spy(function(x) {
					return [x, x-1];
				});

				when.unfold(unspool, condition, noop, 3).then(
					function() {
						assert.equals(unspool.callCount, 3);
					}
				).ensure(done);
			},

			'should abort unfold by returning a rejection': function(done) {
				function condition() {
					return when.reject();
				}

				var unspool = this.spy();

				when.unfold(unspool, condition, noop, 3).then(
					fail,
					function() {
						refute.called(unspool);
					}
				).ensure(done);
			}
		},

		'should call handler with generator result': function(done) {
			function condition(i) {
				return i === 0;
			}

			var handler = this.spy();

			function generator() {
				return [sentinel, 0];
			}

			when.unfold(generator, condition, handler).then(
				function() {
					assert.calledOnceWith(handler, sentinel);
				}
			).ensure(done);
		},

		'should reject when condition throws': function(done) {
			var generator = this.spy();
			var handler = this.spy();

			function condition() {
				throw sentinel;
			}

			when.unfold(generator, condition, handler, other).then(
				fail,
				function(e) {
					refute.called(generator);
					refute.called(handler);
					assert.same(e, sentinel);
				}
			).ensure(done);

		},

		'should reject when generator throws': function(done) {
			var handler = this.spy();

			function condition() {
				return false;
			}
			function generator() {
				throw sentinel;
			}

			when.unfold(generator, condition, handler, other).then(
				fail,
				function(e) {
					refute.called(handler);
					assert.same(e, sentinel);
				}
			).ensure(done);
		},

		'should reject when transform throws': function(done) {
			function condition() {
				return false;
			}

			function transform() {
				throw sentinel;
			}

			function generator() {
				return [other, other];
			}

			when.unfold(generator, condition, transform, other).then(
				fail,
				function(e) {
					assert.same(e, sentinel);
				}
			).ensure(done);
		}
	},

	'iterate': {
		'should invoke condition first': function() {
			var called = false;

			return when.iterate(function(x) {
				assert(called);
				return x;
			}, function() {
				refute(called);
				called = true;
				return true;
			}, function(x) {
				assert(called);
				return x;
			}, 0).then(function() {
				assert(called);
			});
		},

		'should return a promise for ultimate result': function() {
			return when.iterate(function(x) {
				return x+1;
			}, function(x) {
				return x >= 10;
			}, function(x) {
				return x;
			}, 0).then(function(x) {
				assert.equals(x, 10);
			});
		}
	}
});
