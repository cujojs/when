(function(buster, when, delay) {

var assert, fail, resolved, reject;

assert = buster.assert;
fail = buster.assertions.fail;

resolved = when.resolve;
reject = when.reject;

function mapper(val) {
	return val * 2;
}

function deferredMapper(val) {
	return delay(mapper(val), Math.random()*10);
}

buster.testCase('when.map', {

	'should map input values array': function(done) {
		var input = [1, 2, 3];
		when.map(input, mapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
			},
			fail
		).always(done);
	},

	'should map input promises array': function(done) {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.map(input, mapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
			},
			fail
		).always(done);
	},

	'should map mixed input array': function(done) {
		var input = [1, resolved(2), 3];
		when.map(input, mapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
			},
			fail
		).always(done);
	},

	'should map input when mapper returns a promise': function(done) {
		var input = [1,2,3];
		when.map(input, deferredMapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
			},
			fail
		).always(done);
	},

	'should accept a promise for an array': function(done) {
		when.map(resolved([1, resolved(2), 3]), mapper).then(
			function(result) {
				assert.equals(result, [2,4,6]);
			},
			fail
		).always(done);
	},

	'should resolve to empty array when input promise does not resolve to an array': function(done) {
		when.map(resolved(123), mapper).then(
			function(result) {
				assert.equals(result, []);
			},
			fail
		).always(done);
	},

	'should map input promises when mapper returns a promise': function(done) {
		var input = [resolved(1),resolved(2),resolved(3)];
		when.map(input, mapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
			},
			fail
		).always(done);
	},

	'should reject when input contains rejection': function(done) {
		var input = [resolved(1), reject(2), resolved(3)];
		when.map(input, mapper).then(
			fail,
			function(result) {
				assert.equals(result, 2);
			}
		).always(done);
	},


});
})(
	this.buster     || require('buster'),
	this.when       || require('../when'),
	this.when_delay || require('../delay')
);
