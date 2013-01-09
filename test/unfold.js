(function(buster, unfold) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

function noop() {}

buster.testCase('=>when/unfold', {

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
	}

});
})(
	this.buster || require('buster'),
	this.when_unfold || require('../unfold')
);
