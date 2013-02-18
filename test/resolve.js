(function(buster, when) {

var assert, refute, fail, sentinel, other;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

sentinel = {};
other = {};

buster.testCase('when.resolve', {

	'should resolve an immediate value': function(done) {
		var expected = 123;

		when.resolve(expected).then(
			function(value) {
				assert.equals(value, expected);
			},
			fail
		).always(done);
	},

	'should resolve a resolved promise': function(done) {
		var expected, d;

		expected = 123;
		d = when.defer();
		d.resolve(expected);

		when.resolve(d.promise).then(
			function(value) {
				assert.equals(value, expected);
			},
			fail
		).always(done);
	},

	'should reject a rejected promise': function(done) {
		var expected, d;

		expected = 123;
		d = when.defer();
		d.reject(expected);

		when.resolve(d.promise).then(
			fail,
			function(value) {
				assert.equals(value, expected);
			}
		).always(done);
	},

	'when assimilating untrusted thenables': {

		'should trap exceptions during assimilation': function(done) {
			when.resolve({
				then: function() {
					throw sentinel;
				}
			}).then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			).always(done);
		},

		'should ignore exceptions after fulfillment': function(done) {
			when.resolve({
				then: function(onFulfilled) {
					onFulfilled(sentinel);
					throw other;
				}
			}).then(
				function(val) {
					assert.same(val, sentinel);
				},
				fail
			).always(done);
		},

		'should ignore exceptions after rejection': function(done) {
			when.resolve({
				then: function(_, onRejected) {
					onRejected(sentinel);
					throw other;
				}
			}).then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			).always(done);
		},

		'should assimilate thenable used as fulfillment value': function(done) {
			when.resolve({
				then: function(onFulfilled) {
					onFulfilled({
						then: function(onFulfilled) {
							onFulfilled(sentinel);
						}
					});
					throw other;
				}
			}).then(
				function(val) {
					assert.same(val, sentinel);
				},
				fail
			).always(done);
		}
	}

});

})(
	this.buster || require('buster'),
	this.when || require('../when')
);
