(function(buster, when) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

buster.testCase('when.throttle', {
	'should throttle calling the map function': function(done) {
		var dfd = when.defer();
		when.throttle(1, [1, 2], function(v) {
			assert.equals(v, 1);
			return dfd;
		});
		done();
	},
	'should map the array': function(done) {
		when.throttle(2, [1, 2], function(v) {
			return when.defer().resolve(v * 10);
		}).then(function(v) {
			assert.equals(v, [10, 20]);
			done();
		});
	},
	'should call map function when there is space': function(done) {
		var dfds = [when.defer(), when.defer()];
		var called = {};
		when.throttle(1, [0, 1], function(v) {
			called[v] = true;
			return dfds[v];
		});
		assert.equals(called, { 0: true });
		dfds[0].resolve('a');
		assert.equals(called, { 0: true, 1: true});
		done();
	},
	'should resolve only after all tasks are resolved': function(done) {
		var dfds = [when.defer(), when.defer()];
		var resolved = false;
		when.throttle(10, [0, 1], function(v) {
			return dfds[v];
		}).then(function() {
			resolved = true;
		});

		dfds[0].resolve();
		assert.equals(resolved, false);
		dfds[1].resolve();
		assert.equals(resolved, true);
		done();
	}
});
})(
	this.buster || require('buster'),
	this.when || require('../when')
);

