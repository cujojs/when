(function(buster, define) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

define('when/debug-test', function (require) {

	var when;

	when = require('when/debug');

	buster.testCase('when/debug', {

		'tearDown': function() {
			delete when.debug;
		},

		'global rejection handler': {
			'should be called if set': function(done) {
				var spy, d;

				spy = this.spy();
				when.debug = { reject: spy };

				d = when.defer();

				d.promise.then(
					fail,
					function() {
						assert.calledOnce(spy);
					},
					fail
				).ensure(done);

				d.reject();
			}
		},

		'global resolution handler': {
			'should be called if set': function(done) {
				var spy, d;

				spy = this.spy();
				when.debug = { resolve: spy };

				d = when.defer();

				d.promise.then(
					function() {
						assert.calledOnce(spy);
					},
					fail,
					fail
				).ensure(done);

				d.resolve();
			}
		},

		'global progress handler': {
			'should be called if set': function(done) {
				var spy, d;

				spy = this.spy();
				when.debug = { progress: spy };

				d = when.defer();

				d.promise.then(
					function() {
						assert.calledOnce(spy);
					},
					fail
				).ensure(done);

				d.notify();
				d.resolve();
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
