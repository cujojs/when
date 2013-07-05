(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = { value: 'sentinel' };

define('when/monitor/aggregator-test', function (require) {

	var when, aggregator;

	when = require('when');
	aggregator = require('when/monitor/aggregator');

	buster.testCase('when/monitor/aggregator', {
		'tearDown': function() {
			if(typeof console.PromiseStatus === 'function') {
				delete console.PromiseStatus;
			}
		},

		'should have PromiseStatus API': function() {
			assert.isFunction(aggregator(function(){}).PromiseStatus);
		},

		'promise': {
			'rejection should trigger report': function(done) {
				aggregator(function(promises) {
					for(var key in promises) {
						assert.same(promises[key].reason, sentinel);
					}
					done();
				}).publish(console);

				when.promise(function(_, reject) {
					reject(sentinel);
				});
			}
		},

		'defer': {
			'rejection should trigger report': function(done) {
				aggregator(function(promises) {
					for(var key in promises) {
						assert.same(promises[key].reason, sentinel);
					}
					done();
				}).publish(console);

				when.defer().reject(sentinel);
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
