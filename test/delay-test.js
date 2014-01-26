(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

function now() {
	return (new Date()).getTime();
}

sentinel = {};

define('when/delay-test', function (require) {

	var delay, when;

	delay = require('when/delay');
	when = require('when');

	buster.testCase('when/delay', {
		'should resolve after delay': function(done) {
			delay(0).then(
				function() {
					assert(true);
				},
				fail
			).ensure(done);
		},

		'should resolve with provided value after delay': function(done) {
			delay(0, sentinel).then(
				function(val) {
					assert.same(val, sentinel);
					done();
				},
				fail
			).ensure(done);
		},

		'should delay by the provided value': function(done) {
			var start = now();

			delay(100).then(
				function() {
					assert((now() - start) > 50);
				},
				fail
			).ensure(done);
		},

		'should resolve after input promise plus delay': function(done) {
			when.resolve(sentinel).delay(10).then(
				function(val) {
					assert.equals(val, sentinel);
				},
				fail
			).ensure(done);
		},

		'should not delay if rejected': function(done) {
			var d = when.defer();
			d.reject(sentinel);

			d.promise.delay(0).then(
				fail,
				function(val) {
					assert.equals(val, sentinel);
				}
			).ensure(done);
		},

		'should propagate progress': function(done) {
			var d = when.defer();

			d.promise.delay(0).then(null, null,
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
