(function(buster, when) {

var assert = buster.assert;
var refute = buster.refute;

function contains(array, item) {
	for(var i=array.length - 1; i >= 0; --i) {
		if(array[i] === item) {
			return true;
		}
	}

	return false;
}

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

buster.testCase('when.any', {

	'should resolve to undefined with empty input array': function(done) {
		when.any([],
			function(result) {
				refute.defined(result);
				done();
			},
			function() {
				buster.fail();
				done()
			}
		);
	},

	'should resolve with an input value': function(done) {
		var input = [1, 2, 3];
		when.any(input,
			function(result) {
				assert(contains(input, result));
				done();
			},
			function () {
				buster.fail();
				done()
			}
		);
	},

	'should resolve with a promised input value': function(done) {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.any(input,
			function(result) {
				assert(contains([1, 2, 3], result));
				done();
			},
			function() {
				buster.fail();
				done()
			}
		);
	},

	'should reject with a rejected input value': function(done) {
		var input = [rejected(1), resolved(2), resolved(3)];
		when.any(input,
			function() {
				buster.fail();
				done()
			},
			function(result) {
				assert.equals(result, 1);
				done();
			}
		);
	},

	'should resolve when first input promise resolves': function(done) {
		var input = [resolved(1), rejected(2), rejected(3)];
		when.any(input,
			function(result) {
				assert.equals(result, 1);
				done();
			},
			function() {
				buster.fail();
				done()
			}
		);
	}

});

})(
	this.buster || require('buster'),
	this.when   || require('../when')
);
