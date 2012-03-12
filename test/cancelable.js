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

	'should propagate the unaltered resolution value': function(done) {
		var c = cancelable(when.defer(), function() { return false; });
		c.resolve(true);

		c.then(
			function(val) {
				assert(val);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should propagate the unaltered progress value': function(done) {
		var nonce = {},
			c = cancelable(when.defer());
		c.then(
			null,
			null,
			function(status){
				assert.same(nonce, status);
				done();
			}
		);
		c.progress(nonce);
	}

});

})(
	this.buster || require('buster'),
	this.when || require('../when'),
	this.when_cancelable || require('../cancelable')
);
