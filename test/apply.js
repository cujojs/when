// Test boilerplate
var buster, assert, refute, when_apply;

if (typeof require != "undefined") {
	buster = require("buster");
	when_apply = require('../apply');
}

assert = buster.assert;
refute = buster.refute;
// end boilerplate

// variadic arguments-based callback
function f() {
	var sum, i = arguments.length;

	sum = 0;
	while(i) {
		sum += arguments[--i];
	}

	return sum;
}

buster.testCase('when/apply', {
	'should spread array onto arguments': function() {
		assert.equals(6, when_apply(f)([1,2,3]));
	},

	'should fail for non Array-like input': function() {
		assert.exception(function() {
			when_apply(f)(1,2,3);
		});
	}
});