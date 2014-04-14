var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var Promise = require('../../lib/Promise');
var PromiseMonitor = require('../..//monitor/PromiseMonitor');

var sentinel = { value: 'sentinel' };

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
	},

	'should call reporter.configurePromiseMonitor with self': function() {
		var spy = this.spy();
		var m = new PromiseMonitor({
			configurePromiseMonitor: spy
		});

		assert.calledOnceWith(spy, m);
	}
});
