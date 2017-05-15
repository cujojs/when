var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when = require('../when');
var guard = require('../guard');

var sentinel = {};
var other = {};

function noop() {}

buster.testCase('when/guard', {

	'should return a function': function() {
		assert.isFunction(guard());
	},

	'should invoke condition': function(done) {
		var condition, guarded;

		condition = {
			enter: this.spy(),
			exit: this.spy(),
		};
		guarded = guard(condition, noop);

		when(guarded()).then(function () {
			assert.called(condition.enter);
			assert.called(condition.exit);
			done();
		});
	},

	'should invoke guarded function after condition promise fulfills': function(done) {
		var condition, f, guarded;

		condition = {
			enter: function() { return noop; }
		};
		f = this.spy();
		guarded = guard(condition, f);

		guarded(sentinel).then(
			function() {
				assert.calledOnce(f);
				assert.same(f.firstCall.args[0], sentinel);
			},
			fail
		).ensure(done);
	},

	'should notify condition once guarded function settles': function(done) {
		var condition, guarded;

		condition = {
			enter: this.spy()
		};
		guarded = guard(condition, noop);

		guarded().then(
			function() {
				assert.calledOnce(condition.enter);
			},
			fail
		).ensure(done);
	},

	'should initiate next guarded call after notify': function(done) {
		var condition, f, guarded;

		f = this.spy();
		condition = {
			enter: function() { return noop; }
		};
		guarded = guard(condition, f);

		guarded(other).then(
			function() {
				assert.calledOnce(f);
				return guarded(sentinel).then(function() {
					assert.calledTwice(f);
					assert.same(f.secondCall.args[0], sentinel);
				});
			},
			fail
		).ensure(done);
	},

	'n': {
		'should create an object': function() {
			assert.isObject(guard.n(1));
		},

		'should return a promise': function() {
			var c = guard.n(1);
			assert.isFunction(c.enter().then);
		},

		'should allow one execution': function(done) {
			var c, value, first, second;

			c = guard.n(1);
			value = sentinel;

			first = c.enter();
			second = c.enter();

			first.then(
				function() {
					return when().delay(5).then(function() {
						assert.same(value, sentinel);
						done();
					});
				},
				fail
			);
		},

		'should allow two executions': function(done) {
			var one, value, first, second, third;

			one = guard.n(2);
			value = sentinel;

			first = one.enter();
			second = one.enter();
			third = one.enter();

			first.then(
				function() {
					assert.same(value, sentinel);
				},
				fail
			);

			second.then(
				function() {
					return when().delay(5).then(function() {
						assert.same(value, sentinel);
						done();
					});
				},
				fail
			);
		}
	}

});
