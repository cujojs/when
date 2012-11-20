(function(buster, fn, when) {

var assert = buster.assert;

function f(x, y) {
	return x + y;
}

buster.testCase('when/fn', {

	'apply': {
		'should return a promise': function() {
			var result = fn.apply(f, [1, 2]);
			assert(result && typeof result.then === 'function');
		},

		'should accept values for arguments': function() {
			var result = fn.apply(f, [1, 2]);
			return when(result, function(result) {
				assert.equals(result, 3);
			});
		},

	},

	'call': {
		'should return a promise': function() {
			var result = fn.call(f, 1, 2);
			assert(result && typeof result.then === 'function');
		},

		'should accept values for arguments': function() {
			var result = fn.call(f, 1, 2);
			return when(result, function(result) {
				assert.equals(result, 3);
			});
		},

	},

	'bind': {
		'should return a function': function() {
			assert.isFunction(fn.bind(f, null));
		}

	}

});

})(
	this.buster  || require('buster'),
	this.when_fn || require('../function'),
	this.when    || require('../when')
);
