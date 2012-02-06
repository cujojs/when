(function(buster, when) {

var assert = buster.assert;

function mapper(val) {
	return val * 2;
}

function deferredMapper(val) {
	var d = when.defer();

	setTimeout(function() {
		d.resolve(mapper(val));
	}, Math.random() * 10);

	return d.promise;
}

function resolved(val) {
	var d = when.defer();
	d.resolve(val);
	return d.promise;
}

buster.testCase('when.map', {

	'should map input values array': function(done) {
		var input = [1, 2, 3];
		when.map(input, mapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should map input promises array': function(done) {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.map(input, mapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should map mixed input array': function(done) {
		var input = [1, resolved(2), 3];
		when.map(input, mapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should map input when mapper returns a promise': function(done) {
		var input = [1,2,3];
		when.map(input, deferredMapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should map input promises when mapper returns a promise': function(done) {
		var input = [resolved(1),resolved(2),resolved(3)];
		when.map(input, deferredMapper).then(
			function(results) {
				assert.equals(results, [2,4,6]);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	}

});
})(
	this.buster || require('buster'),
	this.when   || require('../when')
);
