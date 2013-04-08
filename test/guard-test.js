(function(buster, define) {

var assert, refute, fail, sentinel, other;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

sentinel = {};
other = {};

function noop() {}

define('when/guard-test', function (require) {

	var guard = require('when/guard');

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
			).then(done, done);
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
			).then(done, done);
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
			).then(done, done);
		},

		'n': {
		},

		'one': {

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
