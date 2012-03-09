(function(buster, when, cancelable) {

var assert = buster.assert;

buster.testCase('when/cancelable', {
	'should decorate deferred with a cancel() method': function() {
		var c = cancelable(when.defer(), function() {});
		assert.typeOf(c.cancel, 'function');
	},

	'should propagate a rejection when a cancelabled deferred is canceled': function(done) {
		var c = cancelable(when.defer(), function() { return 1; });
		c.cancel();

		c.then(
			function() {
				buster.fail();
				done();
			},
			function(v) {
				assert.equals(v, 1);
				done();
			}
		);
	},

	'should not invoke canceler when rejected normally': function(done) {
		var c = cancelable(when.defer(), function() { return 1; });
		c.reject(2);

		c.then(
			function() {
				buster.fail();
				done();
			},
			function(v) {
				assert.equals(v, 2);
				done();
			}
		);

	},

	'should invoke the callback with the resolved value': function() {
		var c = cancelable(when.defer(), function() {});
		c.then(
			function(v) {
				assert.same(1, v);
				done();
			}
		);
		c.resolve(1);
	}
});

})(
	this.buster || require('buster'),
	this.when || require('../when'),
	this.when_cancelable || require('../cancelable')
);
