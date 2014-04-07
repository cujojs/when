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

	'should invoke condition': function() {
		var condition, guarded;

		condition = this.spy();
		guarded = guard(condition, noop);

		guarded();

		assert.called(condition);
	},

	'should invoke guarded function after condition promise fulfills': function(done) {
		var condition, f, guarded;

		condition = function() { return noop; };
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
		var condition, notify, guarded;

		notify = this.spy();
		condition = function() { return notify; };
		guarded = guard(condition, noop);

		guarded().then(
			function() {
				assert.calledOnce(notify);
			},
			fail
		).ensure(done);
	},

	'should initiate next guarded call after notify': function(done) {
		var condition, f, guarded;

		f = this.spy();
		condition = function() { return noop; };
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
		'should create a function': function() {
			assert.isFunction(guard.n(1));
		},

		'should return a promise': function() {
			var c = guard.n(1);
			assert.isFunction(c().then);
		},

		'returned promise should resolve to a function': function(done) {
			var enter = guard.n(1);
			enter().then(
				function(exit) {
					assert.isFunction(exit);
				},
				fail
			).ensure(done);
		},

		'should allow one execution': function(done) {
			var enter, value, first, second;

			enter = guard.n(1);
			value = sentinel;

			first = enter();
			second = enter();

			first.then(
				function(exit) {
					return when().delay(100).then(function() {
						assert.same(value, sentinel);
						exit();
					});
				},
				fail
			);

			second.then(
				function() { value = other; }
			).ensure(done);
		},

		'should allow two executions': function(done) {
			var one, value, first, second, third;

			one = guard.n(2);
			value = sentinel;

			first = one();
			second = one();
			third = one();

			first.then(
				function() {
					assert.same(value, sentinel);
				},
				fail
			);

			second.then(
				function(exit) {
					return when().delay(100).then(function() {
						assert.same(value, sentinel);
						exit();
					});
				},
				fail
			);

			third.then(
				function() { value = other; }
			).ensure(done);
		}
	}

});
