(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = { value: 'sentinel' };

function assertPending(s) {
	assert.equals(s.state, 'pending');
}

function assertFulfilled(s, value) {
	assert.equals(s.state, 'fulfilled');
	assert.same(s.value, value);
}

function assertRejected(s, reason) {
	assert.equals(s.state, 'rejected');
	assert.same(s.reason, reason);
}

define('when/inspect-test', function (require) {

	var inspect = require('when/lib/decorators/inspect');
	var Promise = inspect(require('when/lib/Promise'));

	buster.testCase('inspect', {

		'when inspecting promises': {
			'should return pending state for pending promise': function() {
				var promise = new Promise(function() {});

				assertPending(promise.inspect());
			},

			'should immediately return fulfilled state for fulfilled promise': function() {
				assertFulfilled(Promise.resolve(sentinel).inspect(), sentinel);
			},

			'should return fulfilled state for fulfilled promise': function() {
				var promise = Promise.resolve(sentinel);

				return promise.then(function() {
					assertFulfilled(promise.inspect(), sentinel);
				});
			},

			'should immediately return rejected state for rejected promise': function() {
				assertRejected(Promise.reject(sentinel).inspect(), sentinel);
			},

			'should return rejected state for rejected promise': function() {
				var promise = Promise.reject(sentinel);

				return promise.then(fail, function() {
					assertRejected(promise.inspect(), sentinel);
				});
			}
		},

		'when inspecting thenables': {
			'should return pending state for pending thenable': function() {
				var p = Promise.resolve({ then: function() {} });

				assertPending(p.inspect());
			},

			'should return fulfilled state for fulfilled thenable': function() {
				var p = Promise.resolve({ then: function(fulfill) { fulfill(sentinel); } });

				return p.then(function() {
					assertFulfilled(p.inspect(), sentinel);
				});
			},

			'should return rejected state for rejected thenable': function() {
				var p = Promise.resolve({ then: function(_, rejected) { rejected(sentinel); } });

				return p.then(fail, function() {
					assertRejected(p.inspect(), sentinel);
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
