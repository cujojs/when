var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when, resolved, rejected;

when = require('../when');
resolved = when.resolve;
rejected = when.reject;

buster.testCase('when.join', {

	'should resolve empty input': function(done) {
		return when.join().then(
			function(result) {
				assert.equals(result, []);
			},
			fail
		).ensure(done);
	},

	'should join values': function(done) {
		when.join(1, 2, 3).then(
			function(results) {
				assert.equals(results, [1, 2, 3]);
			},
			fail
		).ensure(done);
	},

	'should join promises array': function(done) {
		when.join(resolved(1), resolved(2), resolved(3)).then(
			function(results) {
				assert.equals(results, [1, 2, 3]);
			},
			fail
		).ensure(done);
	},

	'should join mixed array': function(done) {
		when.join(resolved(1), 2, resolved(3), 4).then(
			function(results) {
				assert.equals(results, [1, 2, 3, 4]);
			},
			fail
		).ensure(done);
	},

	'should reject if any input promise rejects': function(done) {
		when.join(resolved(1), rejected(2), resolved(3)).then(
			fail,
			function(failed) {
				assert.equals(failed, 2);
			}
		).ensure(done);
	}

});
