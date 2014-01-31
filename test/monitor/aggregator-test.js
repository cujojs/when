(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = { value: 'sentinel' };

define('when/monitor/aggregator-test', function (require) {

	var Promise, when, aggregator, monitor;

	Promise = require('when/Promise');
	aggregator = require('when/monitor/aggregator');
	monitor = require('when/lib/monitor');

	buster.testCase('when/monitor/aggregator', {
		'should have PromiseStatus API': function() {
			assert.isFunction(aggregator(function(){}));
		},

		'PromiseStatus': {
			'rejection should trigger report': function(done) {
				var PromiseStatus = aggregator(function(promises) {
					for (var key in promises) {
						assert.same(promises[key].reason, sentinel);
					}
					done();
				});

				var status = new PromiseStatus();
				status.rejected(sentinel);
			}
		},

		'Promise': {
			'reject should trigger report': function(done) {
				var PromiseStatus = aggregator(function() {
					assert(true);
					done();
				});

				var MonitoredPromise = monitor(PromiseStatus, Promise);

				new MonitoredPromise(function(_, reject) {
					reject();
				});
			},

			'Promise.reject should trigger report': function(done) {
				var PromiseStatus = aggregator(function() {
					assert(true);
					done();
				});

				var MonitoredPromise = monitor(PromiseStatus, Promise);

				MonitoredPromise.reject();
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
