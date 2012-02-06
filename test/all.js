(function(buster, when) {

var assert = buster.assert;

function resolved(val) {
	var d = when.defer();
	d.resolve(val);
	return d.promise;
}

function rejected(val) {
	var d = when.defer();
	d.reject(val);
	return d.promise;
}

buster.testCase('when.all', {

	'should resolve empty input': function(done) {
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
	},

	'should resolve values array': function(done) {
		var input = [1, 2, 3];
		when.all(input,
			function(results) {
				assert.equals(results, input);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should resolve promises array': function(done) {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.all(input,
			function(results) {
				assert.equals(results, [1, 2, 3]);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should resolve sparse array input': function(done) {
		var input = [, 1, , 1, 1 ];
		when.all(input,
			function(results) {
				assert.equals(results, input);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reject if any input promise rejects': function(done) {
		var input = [resolved(1), rejected(2), resolved(3)];
		when.all(input,
			function() {
				buster.fail();
				done();
			},
			function(failed) {
				assert.equals(failed, 2);
				done();
			}
		);
	},

	'should throw if called with something other than an array': function() {
		assert.exception(function() {
			when.all(1, 2, 3);
		});
	}
});

})(
	this.buster || require('buster'),
	this.when   || require('../when')
);
