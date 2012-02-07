(function(buster, when) {

var assert = buster.assert;

function plus(sum, val) {
	return sum + val;
}

function resolved(val) {
	var d = when.defer();
	d.resolve(val);
	return d.promise;
}

function later(val) {
	var d = when.defer();

	setTimeout(function() {
		d.resolve(val);
	}, Math.random() * 50);

	return d.promise;
}

buster.testCase('when.reduce', {

	'should reduce values without initial value': function(done) {
		when.reduce([1,2,3], plus).then(
			function(result) {
				assert.equals(result, 6);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reduce values with initial value': function(done) {
		when.reduce([1,2,3], plus, 1).then(
			function(result) {
				assert.equals(result, 7);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reduce values with initial promise': function(done) {
		when.reduce([1,2,3], plus, resolved(1)).then(
			function(result) {
				assert.equals(result, 7);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reduce promised values without initial value': function() {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.reduce(input, plus).then(
			function(result) {
				assert.equals(result, 6);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reduce promised values with initial value': function() {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.reduce(input, plus, 1).then(
			function(result) {
				assert.equals(result, 7);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reduce promised values with initial promise': function() {
		var input = [resolved(1), resolved(2), resolved(3)];
		when.reduce(input, plus, resolved(1)).then(
			function(result) {
				assert.equals(result, 7);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reduce empty input with initial value': function() {
		var input = [];
		when.reduce(input, plus, 1).then(
			function(result) {
				assert.equals(result, 1);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reduce empty input with initial promise': function() {
		when.reduce([], plus, resolved(1)).then(
			function(result) {
				assert.equals(result, 1);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should throw TypeError when input is empty and no initial value or promise provided': function() {
		assert.exception(function() {
			when.reduce([], plus);
		}, 'TypeError');
	},

	'should allow sparse array input without initial': function(done) {
		when.reduce([ , , 1, , 1, 1], plus).then(
			function(result) {
				assert.equals(result, 3);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should allow sparse array input with initial': function(done) {
		when.reduce([ , , 1, , 1, 1], plus, 1).then(
			function(result) {
				assert.equals(result, 4);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);
	},

	'should reduce in input order': function(done) {
		when.reduce([later(1), later(2), later(3)], plus, '').then(
			function(result) {
				assert.equals(result, '123');
				done();
			},
			function() {
				buster.fail();
				done();
			}
		)
	},

	'should provide correct basis value': function(done) {
		function insertIntoArray(arr, val, i) {
			arr[i] = val;
			return arr;
		}

		when.reduce([later(1), later(2), later(3)], insertIntoArray, []).then(
			function(result) {
				assert.equals(result, [1,2,3]);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		)
	}
});

})(
	this.buster || require('buster'),
	this.when   || require('../when')
);
