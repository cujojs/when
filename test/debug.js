(function(buster, when) {

var assert, refute, fail;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

buster.testCase('when/debug', {

	'tearDown': function() {
		delete when.debug;
	},

	'global rejection handler': {
		'should be called if set': function(done) {
			var spy, d;

			spy = this.spy();
			when.debug = { reject: spy };

			d = when.defer();

			d.promise.then(
				fail,
				function() {
					assert.calledOnce(spy);
				},
				fail
			).always(done);

			d.reject();
		}
	},

	'global resolution handler': {
		'should be called if set': function(done) {
			var spy, d;

			spy = this.spy();
			when.debug = { resolve: spy };

			d = when.defer();

			d.promise.then(
				function() {
					assert.calledOnce(spy);
				},
				fail,
				fail
			).always(done);

			d.resolve();
		}
	},

	'global progress handler': {
		'should be called if set': function(done) {
			var spy, d;

			spy = this.spy();
			when.debug = { progress: spy };

			d = when.defer();

			d.promise.then(
				function() {
					assert.calledOnce(spy);
				},
				fail
			).always(done);

			d.notify();
			d.resolve();
		}
	}



});
})(
	this.buster || require('buster'),
	this.when   || require('../debug')
);
