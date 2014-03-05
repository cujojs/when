(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = { value: 'sentinel' };

define('when/monitor/aggregator-test', function (require) {

	var Promise, when, PromiseStatus;

	Promise = require('when/lib/Promise');
	PromiseStatus = require('when/monitor/PromiseStatus');

	buster.testCase('when/monitor/aggregator', {

		'setUp': function() {
			PromiseStatus.reset();
			if(typeof console !== 'undefined') {
				console.PromiseStatus = PromiseStatus;
			}
		},

		'tearDown': function() {
			PromiseStatus.reset();
			if(typeof console !== 'undefined') {
				console.PromiseStatus = void 0;
			}
		},

		'PromiseStatus': {
			'rejection should trigger report': function(done) {
				PromiseStatus.reporter = function(promises) {
					for (var key in promises) {
						assert.same(promises[key].reason, sentinel);
					}
					done();
				};

				var status = new PromiseStatus();
				status.rejected(sentinel);
			}
		},

		'Promise': {
			'reject should trigger report': function(done) {
				PromiseStatus.reporter = function() {
					assert(true);
					done();
				};

				new Promise(function(_, reject) {
					reject();
				});
			},

			'Promise.reject should trigger report': function(done) {
				PromiseStatus.reporter = function() {
					assert(true);
					done();
				};

				Promise.reject();
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
