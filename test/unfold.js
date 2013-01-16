(function(buster, unfold) {

var assert, refute, fail, sentinel, other;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

sentinel = {};
other = {};

function noop() {}

buster.testCase('when/unfold', {

	'should invoke proceed first': function(done) {
		var spy;

		spy = this.stub().returns(false);

		unfold(noop, spy, noop, sentinel).then(
			function(value) {
				assert.same(value, sentinel);
			}
		).always(done);
	},

	'should call generator until proceed returns falsey': function(done) {
		var i, spy;

		i = 3;
		function proceed() {
			return i--;
		}

		spy = this.spy();

		unfold(spy, proceed, noop, sentinel).then(
			function() {
				assert.calledWith(spy, sentinel);
				assert.equals(spy.callCount, 3);
			}
		).always(done);
	},

	'should call transform with generator result': function(done) {
		var i, spy;

		i = 1;
		function proceed() {
			return i--;
		}

		spy = this.spy();

		unfold(this.stub().returns(sentinel), proceed, spy).then(
			function() {
				assert.calledOnceWith(spy, sentinel);
			}
		).always(done);
	},

	'should reject when proceed throws': function(done) {
		var proceed, transform, generator;

		generator = this.stub().returns(other);
		transform = this.spy();
		proceed = this.stub().throws(sentinel);

		unfold(generator, proceed, transform, other).then(
			fail,
			function(e) {
				refute.called(generator);
				refute.called(transform);
				assert.same(e, sentinel);
			}
		).always(done);

	},

	'should reject when generator throws': function(done) {
		var proceed, transform, generator;

		proceed = this.stub().returns(true);
		transform = this.spy();
		generator = this.stub().throws(sentinel);

		unfold(generator, proceed, transform, other).then(
			fail,
			function(e) {
				refute.called(transform);
				assert.same(e, sentinel);
			}
		).always(done);
	},

	'should reject when transform throws': function(done) {
		var proceed, transform, generator;

		proceed = this.stub().returns(true);
		transform = this.stub().throws(sentinel);
		generator = this.stub().returns(other);

		unfold(generator, proceed, transform, other).then(
			fail,
			function(e) {
				assert.same(e, sentinel);
			}
		).always(done);
	}

});
})(
	this.buster || require('buster'),
	this.when_unfold || require('../unfold')
);
