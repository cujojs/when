var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when = require('../when');
var poll = require('../poll');

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
		when().delay(100).then(p.cancel);
	},

	'should poll with interval function': function (done) {
		var countdown, interval;

		countdown = 3;
		interval = this.spy(function () {
			return when().delay(10);
		});

		poll(function () {}, interval, function () { countdown -= 1; return countdown === 0; }).then(
			function () {
				assert(interval.calledTwice);
				done();
			},
			failIfCalled(done, 'should never be rejected')
		);
	},

	'should be canceled by rejected work': function (done) {
		var p = poll(when.reject, 10);

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
		p = poll(function () {
			i += 1; return i;
		}, 10, function () {
			return i < 3 ? when.reject() : when.resolve(true);
		});
		progback = this.spy(function (result) {
			assert.equals(result, i);
		});

		p.then(
			function (result) {
				assert.equals(result, 3);
				assert(progback.calledTwice);
				done();
			},
			failIfCalled(done, 'should never be rejected'),
			progback
		);
	},

	'should keep polling from falsey resolved verification, stop for truthy resolved verification': function (done) {
		var i, p, progback;

		i = 0;
		p = poll(function () { i += 1; return i; }, 10, function (result) { return result < 3 ? when.resolve(false) : when.resolve(true); });
		progback = this.spy(function (result) { assert.equals(result, i); });

		p.then(
			function (result) {
				assert.equals(result, 3);
				assert(progback.calledTwice);
				done();
			},
			failIfCalled(done, 'should never be rejected'),
			progback
		);
	}

});
