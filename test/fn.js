(function(buster, fn, when) {

var assert = buster.assert;

function f(x, y) {
	return x + y;
}

buster.testCase('when/fn', {

	'apply': {
		'should return a promise': function() {
			var result = fn.apply(f, null, [1, 2]);
			assert(result && typeof result.then === 'function');
		},

		'should accept values for arguments': function() {
			var result = fn.apply(f, null, [1, 2]);
			return when(result, function(result) {
				assert.equals(result, 3);
			});
		},

		'should accept promises for arguments': function() {
			var result = fn.apply(f, null, [when.resolve(1), when.resolve(2)]);
			return when(result, function(result) {
				assert.equals(result, 3);
			});
		},

		'should accept value for context': function() {
			function f2(y) {
				return f(this, y);
			}

			var result = fn.apply(f2, 1, [2]);
			return when(result, function(result) {
				assert.equals(result, 3);
			});
		},

		'should accept promise for context': function() {
			function f2(y) {
				return f(this, y);
			}

			var result = fn.apply(f2, when.resolve(1), [2]);
			return when(result, function(result) {
				assert.equals(result, 3);
			});
		}
	}
});

})(
	this.buster  || require('buster'),
	this.when_fn || require('../fn'),
	this.when    || require('../when')
);
