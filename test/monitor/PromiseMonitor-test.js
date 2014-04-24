var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var Promise = require('../../lib/Promise');
var PromiseMonitor = require('../../monitor/PromiseMonitor');

buster.testCase('when/monitor/PromiseMonitor', {

	'should call reporter.configurePromiseMonitor with self': function() {
		var spy = this.spy();
		var m = new PromiseMonitor({
			configurePromiseMonitor: spy
		});

		assert.calledOnceWith(spy, m);
	}
});
