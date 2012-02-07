(function(buster, when) {

var assert = buster.assert;
var refute = buster.refute;

buster.testCase('when.chain', {
	'should return a promise for an input value': function() {
		var d, result;

		d = when.defer();

		result = when.chain(1, d.resolver);

		assert.typeOf(result.then, 'function');
		refute.equals(result, d);
		refute.equals(result, d.promise);
	},

	'should return a promise for an input promise': function() {
		var d1, d2, result;

		d1 = when.defer();
		d2 = when.defer();

		result = when.chain(d1.promise, d2.resolver);

		assert.typeOf(result.then, 'function');
		refute.equals(result, d1);
		refute.equals(result, d1.promise);
		refute.equals(result, d2);
		refute.equals(result, d2.promise);
	},

	'should resolve resolver with input value': function(done) {
		var d = when.defer();

		d.promise.then(
			function(val) {
				assert.equals(val, 1);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);

		when.chain(1, d.resolver);
	},

	'should resolve resolver with input promise value': function(done) {
		var d, input;

		d = when.defer();

		d.promise.then(
			function(val) {
				assert.equals(val, 1);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);

		input = when.defer();
		input.resolve(1);

		when.chain(input.promise, d.resolver);
	},

	'should resolve resolver with provided value when input is a value': function(done) {
		var d = when.defer();

		d.promise.then(
			function(val) {
				assert.equals(val, 2);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);

		when.chain(1, d.resolver, 2);
	},

	'should resolve resolver with provided value when input is a promise': function(done) {
		var d, input;

		d = when.defer();

		d.promise.then(
			function(val) {
				assert.equals(val, 2);
				done();
			},
			function() {
				buster.fail();
				done();
			}
		);

		input = when.defer();
		input.resolve(1);

		when.chain(input.promise, d.resolver, 2);
	},

	'should reject resolver with input promise rejection reason': function(done) {
		var d, input;

		d = when.defer();

		d.promise.then(
			function () {
				buster.fail();
				done();
			},
			function (val) {
				assert.equals(val, 1);
				done();
			}
		);

		input = when.defer();
		input.reject(1);

		when.chain(input.promise, d.resolver);
	},

	'should reject resolver with input promise rejection reason when optional value provided': function(done) {
		var d, input;

		d = when.defer();

		d.promise.then(
			function () {
				buster.fail();
				done();
			},
			function (val) {
				assert.equals(val, 1);
				done();
			}
		);

		input = when.defer();
		input.reject(1);

		when.chain(input.promise, d.resolver, 2);
	}
})

})(
	this.buster || require('buster'),
	this.when   || require('../when')
);
