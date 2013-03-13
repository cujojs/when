(function(buster, define) {

var assert, refute, fail, sentinel, other;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

sentinel = {};
other = {};

function noop() {}

define('when/unfold-test', function (require) {

	var unfold, when;

	unfold = require('when/unfold');
	when = require('when');

	buster.testCase('when/unfold', {

		'should invoke condition first': function(done) {
			var condition;

			condition = this.stub().returns(true);

			unfold(noop, condition, noop, sentinel).then(
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

			unfold(unspool, condition, noop, 3).then(
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

				unfold(unspool, condition, noop, 3).then(
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

				unfold(unspool, condition, noop, 3).then(
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

				unfold(unspool, condition, noop, 3).then(
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

				unfold(unspool, condition, noop, 3).then(
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

				unfold(unspool, condition, noop, 3).then(
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

			unfold(this.stub().returns([sentinel, 0]), condition, handler).then(
				function() {
					assert.calledOnceWith(handler, sentinel);
				}
			).ensure(done);
		},

		'should reject when condition throws': function(done) {
			var condition, handler, generator;

			generator = this.spy();
			handler = this.spy();
			condition = this.stub().throws(sentinel);

			unfold(generator, condition, handler, other).then(
				fail,
				function(e) {
					refute.called(generator);
					refute.called(handler);
					assert.same(e, sentinel);
				}
			).ensure(done);

		},

		'should reject when generator throws': function(done) {
			var condition, handler, generator;

			condition = this.stub().returns(false);
			handler = this.spy();
			generator = this.stub().throws(sentinel);

			unfold(generator, condition, handler, other).then(
				fail,
				function(e) {
					refute.called(handler);
					assert.same(e, sentinel);
				}
			).ensure(done);
		},

		'should reject when transform throws': function(done) {
			var condition, transform, generator;

			condition = this.stub().returns(false);
			transform = this.stub().throws(sentinel);
			generator = this.stub().returns([other, other]);

			unfold(generator, condition, transform, other).then(
				fail,
				function(e) {
					assert.same(e, sentinel);
				}
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
