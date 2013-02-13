(function(buster, poll, when, delay) {

var assert, refute, fail, resolved, rejected;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

resolved = when.resolve;
rejected = when.reject;

function failIfCalled(done, message) {
	return function () {
		fail(message || 'should never be called');
		done();
	};
}

buster.testCase('when/poll', {

	'should poll until canceled': function (done) {
		var i, p, progback;

		i = 0;
		p = poll(function () { i += 1; return i; }, 10);
		progback = this.spy(function (result) { assert.equals(i, result); });

		p.then(
			failIfCalled(done, 'should never be resolved'),
			function () {
				assert(progback.called);
				done();
			},
			progback
		);
		delay(100).then(p.cancel);
	},

	'should poll with interval function': function (done) {
		var countdown, interval;

		countdown = 3;
		interval = this.spy(function () {
			return delay(10);
		});

		poll(function () {}, interval, function () { countdown -= 1; return countdown == 0; }).then(
			function () {
				assert(interval.calledTwice);
				done();
			},
			failIfCalled(done, 'should never be rejected')
		);
	},

	'should be canceled by rejected work': function (done) {
		var p = poll(rejected, 10);

		p.then(
			failIfCalled(done, 'should never be resolved'),
			function () {
				assert(true);
				done();
			},
			failIfCalled(done, 'should never receive progress')
		);
	},

	'should poll with delayed start': function (done) {
		var i, p, progback;

		i = 0;
		p = poll(function () { i += 1; return i; }, 10, function (result) { return result === 2; }, true);
		progback = this.spy(function (result) { assert.equals(result, 1); });

		p.then(
			function (result) {
				assert.equals(result, 2);
				assert(progback.called);
				done();
			},
			failIfCalled(done),
			progback
		);
	},

	'should keep polling from rejected verification, stop for resolved verification': function (done) {
		var i, p, progback;

		i = 0;
		p = poll(function () { i += 1; return i; }, 10, function () { return i < 3 ? rejected() : resolved(true); });
		progback = this.spy(function (result) { assert.equals(result, 2); });

		p.then(
			function (result) {
				assert.equals(result, 3);
				assert(progback.called);
				done();
			},
			failIfCalled(done, 'should never be rejected'),
			progback
		);
	},

	'should keep polling from falsey resolved verification, stop for truthy resolved verification': function (done) {
		var i, p, progback;

		i = 0;
		p = poll(function () { i += 1; return i; }, 10, function (result) { return result < 3 ? resolved(false) : resolved(true); });
		progback = this.spy(function (result) { assert.equals(result, 2); });

		p.then(
			function (result) {
				assert.equals(result, 3);
				assert(progback.called);
				done();
			},
			failIfCalled(done, 'should never be rejected'),
			progback
		);
	}

});
})(
	this.buster || require('buster'),
	this.when_poll || require('../poll'),
	this.when || require('../when'),
	this.when_delay || require('../delay')
);
