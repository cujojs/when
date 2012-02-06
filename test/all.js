// Test boilerplate
var buster, assert, refute, when;

if (typeof require != "undefined") {
	buster = require("buster");
	when = require('../when');
}

assert = buster.assert;
refute = buster.refute;
// end boilerplate

buster.testCase('when.all', {
	'should resolve with empty input': function(done) {
		when.all([],
			function(result) {
				assert.equals(result, []);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	}
});