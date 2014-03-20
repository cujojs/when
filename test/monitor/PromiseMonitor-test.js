(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = { value: 'sentinel' };

define('when/monitor/PromiseMonitor-test', function (require) {

	var Promise = require('when/lib/Promise');
	var PromiseMonitor = require('when/monitor/PromiseMonitor');

	buster.testCase('when/monitor/PromiseMonitor', {

		'reject should trigger report': function(done) {
			if (typeof console === 'undefined') {
				done();
				return;
			}

			console.promiseMonitor = new PromiseMonitor({ log: function () {
				console.promiseMonitor = void 0;
				assert(true);
				done();
			}});

			new Promise(function (_, reject) {
				reject();
			});
		},

		'Promise.reject should trigger report': function(done) {
			if (typeof console === 'undefined') {
				done();
				return;
			}

			console.promiseMonitor = new PromiseMonitor({ log: function () {
				console.promiseMonitor = void 0;
				assert(true);
				done();
			}});

			Promise.reject();
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
