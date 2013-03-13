(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

function FakePromise() {
	this.then = function() {
		return this;
	};
}

sentinel = {};

define('when/timeout-test', function (require) {

	var timeout, when;

	timeout = require('when/timeout');
	when = require('when');

	buster.testCase('when/timeout', {
		'should reject after timeout': function(done) {
			timeout(new FakePromise(), 10).then(
				fail,
				function(e) {
					assert(e instanceof Error);
				}
			).ensure(done);
		},

		'should not timeout when rejected before timeout': function(done) {
			timeout(when.reject(sentinel), 10).then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			).ensure(done);
		},

		'should not timeout when forcibly resolved before timeout': function(done) {
			timeout(when.resolve(sentinel), 10).then(
				function(val) {
					assert.same(val, sentinel);
				},
				fail
			).ensure(done);
		},

		'should propagate progress': function(done) {
			var d = when.defer();

			timeout(d.promise, 10).then(null, null,
				function(val) {
					assert.same(val, sentinel);
					d.resolve();
				}
			).ensure(done);

			d.notify(sentinel);
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
