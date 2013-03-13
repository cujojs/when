(function(buster, define) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

function failIfCalled(done, message) {
	return function () {
		fail(message || 'should never be called');
		done();
	};
}

define('when/poll-test', function (require) {

	var poll, when, delay, resolved, rejected;

	poll = require('when/poll');
	when = require('when');
	delay = require('when/delay');
	resolved = when.resolve;
	rejected = when.reject;

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

			poll(function () {}, interval, function () { countdown -= 1; return countdown === 0; }).then(
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
			p = poll(function () {
				i += 1; return i;
			}, 10, function () {
				return i < 3 ? rejected() : resolved(true);
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
			p = poll(function () { i += 1; return i; }, 10, function (result) { return result < 3 ? resolved(false) : resolved(true); });
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
