(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

function assertFulfilled(s, value) {
	assert.equals(s.state, 'fulfilled');
	assert.same(s.value, value);
}

function assertRejected(s, reason) {
	assert.equals(s.state, 'rejected');
	assert.same(s.reason, reason);
}

define('when/settle-test', function (require) {

	var when;

	when = require('when');

	buster.testCase('when.settle', {
		'should settle empty array': function() {
			return when.settle([]).then(function(settled) {
				assert.equals(settled.length, 0);
			});
		},

		'should reject if promise for input array rejects': function() {
			return when.settle(when.reject(sentinel)).then(
				fail,
				function(reason) {
					assert.same(reason, sentinel);
				}
			);
		},

		'should settle values': function() {
			var array = [0, 1, sentinel];
			return when.settle(array).then(function(settled) {
				assertFulfilled(settled[0], 0);
				assertFulfilled(settled[1], 1);
				assertFulfilled(settled[2], sentinel);
			});
		},

		'should settle promises': function() {
			var array = [0, when.resolve(sentinel), when.reject(sentinel)];
			return when.settle(array).then(function(settled) {
				assertFulfilled(settled[0], 0);
				assertFulfilled(settled[1], sentinel);
				assertRejected(settled[2], sentinel);
			});
		},

		'returned promise should fulfill once all inputs settle': function() {
			var array, p1, p2, resolve, reject;

			p1 = when.promise(function(r) { resolve = r; });
			p2 = when.promise(function(_, r) { reject = r; });

			array = [0, p1, p2];

			setTimeout(function() { resolve(sentinel); }, 0);
			setTimeout(function() { reject(sentinel); }, 0);

			return when.settle(array).then(function(settled) {
				assertFulfilled(settled[0], 0);
				assertFulfilled(settled[1], sentinel);
				assertRejected(settled[2], sentinel);
			});
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
