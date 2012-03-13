(function(buster, when, poll, delay) {

var assert, refute, fail;

assert = buster.assertions.assert;
refute = buster.assertions.refute;
fail = buster.assertions.fail;

function rejected(value) {
	var d = when.defer();
	d.reject(value);
	return d;
}

function resolved(value) {
	var d = when.defer();
	d.resolve(value);
	return d;
}

function failIfCalled(done, message) {
	return function() {
		fail(message || "should never be called");
		done();
	}
}

buster.testCase('when/poll', {

	'should poll until canceled': function(done) {
		var i, p, progback;

		i = 0;
		p = poll(function() { i++; return i }, 10);
		progback = this.spy(function(result) { assert.equals(i, result); });

		p.then(
			failIfCalled(done, "should never be resolved"),
			function(result) {
				assert(progback.called);
				done();
			},
			progback
		);
		delay(100).then(p.cancel);
	},

	'should be canceled by rejected work': function(done) {
		var p = poll(rejected, 10);

		p.then(
			failIfCalled(done, "should never be resolved"),
			function(result) {
				assert(true);
				done();
			},
			failIfCalled(done, "should never receive progress")
		);
	},

	'should poll with delayed start': function(done) {
		var i, p, progback;

		i = 0;
		p = poll(function() { i++; return i }, 10, function(result) { return result == 2 }, true);
		progback = this.spy(function(result) { assert.equals(result, 1); });

		p.then(
			function(result) {
				assert.equals(result, 2);
				assert(progback.called);
				done();
			},
			failIfCalled(done),
			progback
		);
	},

	'should keep polling from rejected verification, stop for resolved verification': function(done) {
		var i, p, progback;

		i = 0;
		p = poll(function() { i++; return i }, 10, function(result) { return i < 3 ? rejected() : resolved(true) });
		progback = this.spy(function(result) { assert.equals(result, 2); });

		p.then(
			function(result) {
				assert.equals(result, 3);
				assert(progback.called);
				done();
			},
			failIfCalled(done, "should never be rejected"),
			progback
		);
	},

	'should keep polling from falsey resolved verification, stop for truethy resolved verification': function(done) {
		var i, p, progback;

		i = 0;
		p = poll(function() { i++; return i }, 10, function(result) { return result < 3 ? resolved(false) : resolved(true) });
		progback = this.spy(function(result) { assert.equals(result, 2); });

		p.then(
			function(result) {
				assert.equals(result, 3);
				assert(progback.called);
				done();
			},
			failIfCalled(done, "should never be rejected"),
			progback
		);
	}

});
})(
	this.buster || require('buster'),
	this.when || require('../when'),
	this.when_poll || require('../poll'),
	this.when_delay || require('../delay')
);
