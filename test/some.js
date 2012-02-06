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

function contains(array, value) {
	for(var i = array.length-1; i >= 0; i--) {
		if(array[i] === value) {
			return true;
		}
	}

	return false;
}

function subset(subset, superset) {
	var i, subsetLen;

	subsetLen = subset.length;

	if (subsetLen > superset.length) {
		return false;
	}

	for(i = 0; i<subsetLen; i++) {
		if(!contains(superset, subset[i])) {
			return false;
		}
	}

	return true;
}

buster.testCase('when.some', {

	'should resolve empty input': function(done) {
		when.some([], 1,
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
		when.some(input, 2,
			function(results) {
				assert(subset(results, input));
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
		when.some(input, 2,
			function(results) {
				assert(subset(results, [1, 2, 3]));
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should resolve sparse array input': function(done) {
		var input = [, 1, , 2, 3 ];
		when.some(input, 2,
			function(results) {
				assert(subset(results, input));
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reject if any input promise rejects before desired number of inputs are resolved': function(done) {
		var input = [resolved(1), rejected(2), resolved(3)];
		when.some(input, 2,
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
			when.some(1, 2, 3, 2);
		});
	}

});
})(
	this.buster || require('buster'),
	this.when   || require('../when')
);
